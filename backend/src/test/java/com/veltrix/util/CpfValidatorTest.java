package com.veltrix.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class CpfValidatorTest {

    // CPF válido real para testes
    private static final String CPF_VALIDO = "52998224725";

    @Test
    void apenasDigitos_removeFormatacao() {
        assertThat(CpfValidator.apenasDigitos("529.982.247-25")).isEqualTo("52998224725");
    }

    @Test
    void apenasDigitos_nulo_retornaVazio() {
        assertThat(CpfValidator.apenasDigitos(null)).isEmpty();
    }

    @Test
    void valido_cpfCorreto_retornaTrue() {
        assertThat(CpfValidator.valido(CPF_VALIDO)).isTrue();
    }

    @Test
    void valido_nulo_retornaFalse() {
        assertThat(CpfValidator.valido(null)).isFalse();
    }

    @Test
    void valido_menosDe11Digitos_retornaFalse() {
        assertThat(CpfValidator.valido("1234567890")).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "00000000000", "11111111111", "22222222222",
        "33333333333", "44444444444", "55555555555",
        "66666666666", "77777777777", "88888888888",
        "99999999999"
    })
    void valido_digitosRepetidos_retornaFalse(String cpf) {
        assertThat(CpfValidator.valido(cpf)).isFalse();
    }

    @Test
    void valido_primeiroDigitoVerificadorErrado_retornaFalse() {
        // altera último dígito do primeiro verificador
        assertThat(CpfValidator.valido("52998224735")).isFalse();
    }

    @Test
    void valido_segundoDigitoVerificadorErrado_retornaFalse() {
        assertThat(CpfValidator.valido("52998224724")).isFalse();
    }

    @Test
    void valido_comLetras_retornaFalse() {
        assertThat(CpfValidator.valido("5299822472A")).isFalse();
    }
}
