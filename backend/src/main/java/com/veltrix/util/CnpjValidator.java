package com.veltrix.util;

/** Validação de CNPJ (14 dígitos, dígitos verificadores). */
public final class CnpjValidator {

    private CnpjValidator() {}

    public static String apenasDigitos(String cnpj) {
        if (cnpj == null) return "";
        return cnpj.replaceAll("\\D", "");
    }

    public static boolean valido(String cnpjDigitos) {
        if (cnpjDigitos == null || cnpjDigitos.length() != 14) return false;
        if (cnpjDigitos.chars().distinct().count() == 1) return false;
        int[] d = new int[14];
        for (int i = 0; i < 14; i++) {
            char c = cnpjDigitos.charAt(i);
            if (c < '0' || c > '9') return false;
            d[i] = c - '0';
        }
        int[] w1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int soma = 0;
        for (int i = 0; i < 12; i++) soma += d[i] * w1[i];
        int r = soma % 11;
        int dig1 = r < 2 ? 0 : 11 - r;
        if (dig1 != d[12]) return false;
        int[] w2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        soma = 0;
        for (int i = 0; i < 13; i++) soma += d[i] * w2[i];
        r = soma % 11;
        int dig2 = r < 2 ? 0 : 11 - r;
        return dig2 == d[13];
    }
}
