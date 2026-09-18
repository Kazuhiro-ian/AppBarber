package com.barber.app.repository;

import com.barber.app.domain.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    List<Produto> findByNomeContainingIgnoreCaseOrderByNomeAsc(String nome);

    List<Produto> findByCategoriaIgnoreCaseOrderByNomeAsc(String categoria);

    /** Produtos que atingiram (ou ficaram abaixo do) estoque mínimo. */
    @Query("select p from Produto p where p.quantidade <= p.quantidadeMinima order by p.nome")
    List<Produto> findAbaixoDoEstoqueMinimo();
}
