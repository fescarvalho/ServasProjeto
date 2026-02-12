/**
 * Valida um endereço de email
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valida os dados de uma missa
 */
export function validateMassData(data: {
    date: string;
    time?: string;
    maxServers: number;
}): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.date) {
        errors.push("Data é obrigatória");
    }

    if (data.maxServers < 1) {
        errors.push("Número de vagas deve ser maior que zero");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Valida credenciais de login
 */
export function validateLoginCredentials(email: string, password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!email) {
        errors.push("Email é obrigatório");
    } else if (!validateEmail(email)) {
        errors.push("Email inválido");
    }

    if (!password) {
        errors.push("Senha é obrigatória");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
