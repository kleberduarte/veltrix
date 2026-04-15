package com.veltrix.util;

/** Validação de CPF (11 dígitos, dígitos verificadores). */
public final class CpfValidator {

    private CpfValidator() {}

    public static String apenasDigitos(String cpf) {
        if (cpf == null) return "";
        return cpf.replaceAll("\\D", "");
    }

    public static boolean valido(String cpfDigitos) {
        if (cpfDigitos == null || cpfDigitos.length() != 11) return false;
        if (cpfDigitos.chars().distinct().count() == 1) return false;
        int[] d = new int[11];
        for (int i = 0; i < 11; i++) {
            char c = cpfDigitos.charAt(i);
            if (c < '0' || c > '9') return false;
            d[i] = c - '0';
        }
        int soma = 0;
        for (int i = 0; i < 9; i++) soma += d[i] * (10 - i);
        int dig1 = 11 - (soma % 11);
        if (dig1 >= 10) dig1 = 0;
        if (dig1 != d[9]) return false;
        soma = 0;
        for (int i = 0; i < 10; i++) soma += d[i] * (11 - i);
        int dig2 = 11 - (soma % 11);
        if (dig2 >= 10) dig2 = 0;
        return dig2 == d[10];
    }
}
