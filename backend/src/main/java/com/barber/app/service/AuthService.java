package com.barber.app.service;

import com.barber.app.domain.Barbeiro;
import com.barber.app.domain.Cliente;
import com.barber.app.domain.Usuario;
import com.barber.app.domain.enums.TipoUsuario;
import com.barber.app.dto.auth.AlterarSenhaRequest;
import com.barber.app.dto.auth.AtualizarPerfilRequest;
import com.barber.app.dto.auth.AuthResponse;
import com.barber.app.dto.auth.LoginRequest;
import com.barber.app.dto.auth.RegistroRequest;
import com.barber.app.dto.auth.UsuarioResponse;
import com.barber.app.exception.RegraNegocioException;
import com.barber.app.repository.UsuarioRepository;
import com.barber.app.security.JwtService;
import com.barber.app.security.UsuarioLogado;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Cria a conta e já devolve o token. Contas BARBEIRO/ADMIN só podem ser
     * criadas por um ADMIN autenticado.
     */
    @Transactional
    public AuthResponse registrar(RegistroRequest request) {
        String email = request.email().trim().toLowerCase();

        if (!Usuario.validarEmail(email)) {
            throw new RegraNegocioException("E-mail inválido");
        }
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new RegraNegocioException("Já existe uma conta com o e-mail " + email);
        }

        TipoUsuario tipo = request.tipoUsuario() != null ? request.tipoUsuario() : TipoUsuario.CLIENTE;
        if (tipo != TipoUsuario.CLIENTE && !ehAdminAutenticado()) {
            throw new RegraNegocioException("Somente um administrador pode criar contas de " + tipo);
        }

        String hash = passwordEncoder.encode(request.senha());
        Usuario usuario = switch (tipo) {
            case CLIENTE -> new Cliente(request.nome(), email, hash, request.telefone());
            case BARBEIRO -> new Barbeiro(request.nome(), email, hash, request.telefone());
            case ADMIN -> new Usuario(request.nome(), email, hash, request.telefone(), TipoUsuario.ADMIN);
        };

        Usuario salvo = usuarioRepository.save(usuario);
        return montarResposta(salvo);
    }

    /** Autentica por e-mail/senha e emite o JWT. */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new BadCredentialsException("E-mail ou senha inválidos"));

        if (!passwordEncoder.matches(request.senha(), usuario.getSenha())) {
            throw new BadCredentialsException("E-mail ou senha inválidos");
        }
        return montarResposta(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse usuarioAtual() {
        return UsuarioResponse.de(UsuarioLogado.obrigatorio());
    }

    @Transactional
    public UsuarioResponse atualizarPerfil(AtualizarPerfilRequest request) {
        Usuario usuario = carregarUsuarioLogado();
        usuario.atualizarPerfil(request.nome(), request.telefone(), request.fotoPerfil());
        return UsuarioResponse.de(usuarioRepository.save(usuario));
    }

    @Transactional
    public void alterarSenha(AlterarSenhaRequest request) {
        Usuario usuario = carregarUsuarioLogado();
        if (!passwordEncoder.matches(request.senhaAtual(), usuario.getSenha())) {
            throw new RegraNegocioException("A senha atual está incorreta");
        }
        usuario.alterarSenha(passwordEncoder.encode(request.novaSenha()));
        usuarioRepository.save(usuario);
    }

    private Usuario carregarUsuarioLogado() {
        Long id = UsuarioLogado.obrigatorio().getId();
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Usuário autenticado não existe mais"));
    }

    private boolean ehAdminAutenticado() {
        return UsuarioLogado.atual().map(Usuario::isAdmin).orElse(false);
    }

    private AuthResponse montarResposta(Usuario usuario) {
        return AuthResponse.bearer(
                jwtService.gerarToken(usuario),
                jwtService.expiracaoEmSegundos(),
                UsuarioResponse.de(usuario));
    }
}
