package com.barber.app.exception;

/** Lançada quando um recurso solicitado não existe — vira HTTP 404. */
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }

    public static RecursoNaoEncontradoException de(String recurso, Object id) {
        return new RecursoNaoEncontradoException("%s não encontrado(a) para o id %s".formatted(recurso, id));
    }
}
