import { useMemo, useState, useRef } from "react";
import { theme } from "../theme/theme";

// ── TIPOS ───────────────────────────────────────────────────────────────────
type LiturgicalColor = "roxo" | "verde" | "branco" | "vermelho" | "rosa";
interface DayData {
    season: string;
    color: LiturgicalColor;
    celebration?: string;
}

// ── DADOS DE 2026 ───────────────────────────────────────────────────────────
// Chave: "MM-DD"
const LITURGICAL_DATA_2026: Record<string, DayData> = {
    // Janeiro — Tempo do Natal / Tempo Comum
    "01-01": { season: "Solenidade de Maria Mãe de Deus", color: "branco", celebration: "Solenidade de Maria, Mãe de Deus" },
    "01-02": { season: "Tempo do Natal", color: "branco", celebration: "Ss. Basílio Magno e Gregório Nazianzeno" },
    "01-03": { season: "Tempo do Natal", color: "branco", celebration: "Ss. Nome de Jesus" },
    "01-04": { season: "Tempo do Natal", color: "branco" },
    "01-05": { season: "Tempo do Natal", color: "branco" },
    "01-06": { season: "Epifania do Senhor", color: "branco", celebration: "Solenidade da Epifania do Senhor" },
    "01-07": { season: "Tempo Comum", color: "verde", celebration: "S. Raimundo de Penafort" },
    "01-08": { season: "Batismo do Senhor", color: "branco", celebration: "Batismo do Senhor" },
    "01-09": { season: "Tempo Comum", color: "verde" },
    "01-10": { season: "Tempo Comum", color: "verde" },
    "01-11": { season: "Tempo Comum", color: "verde" },
    "01-12": { season: "Tempo Comum", color: "verde" },
    "01-13": { season: "Tempo Comum", color: "verde", celebration: "S. Hilário" },
    "01-14": { season: "Tempo Comum", color: "verde" },
    "01-15": { season: "Tempo Comum", color: "verde" },
    "01-16": { season: "Tempo Comum", color: "verde" },
    "01-17": { season: "Tempo Comum", color: "verde", celebration: "S. Antônio do Deserto" },
    "01-18": { season: "Semana de Oração pela Unidade", color: "verde" },
    "01-19": { season: "Tempo Comum", color: "verde" },
    "01-20": { season: "Tempo Comum", color: "verde", celebration: "Ss. Fabiano e Sebastião" },
    "01-21": { season: "Tempo Comum", color: "vermelho", celebration: "Sta. Inês" },
    "01-22": { season: "Tempo Comum", color: "verde" },
    "01-23": { season: "Tempo Comum", color: "verde" },
    "01-24": { season: "Tempo Comum", color: "branco", celebration: "S. Francisco de Sales" },
    "01-25": { season: "Tempo Comum", color: "branco", celebration: "Conversão de S. Paulo" },
    "01-26": { season: "Tempo Comum", color: "branco", celebration: "Ss. Timóteo e Tito" },
    "01-27": { season: "Tempo Comum", color: "verde" },
    "01-28": { season: "Tempo Comum", color: "branco", celebration: "S. Tomás de Aquino" },
    "01-29": { season: "Tempo Comum", color: "verde" },
    "01-30": { season: "Tempo Comum", color: "verde" },
    "01-31": { season: "Tempo Comum", color: "branco", celebration: "S. João Bosco" },

    // Fevereiro
    "02-01": { season: "Tempo Comum", color: "verde" },
    "02-02": { season: "Apresentação do Senhor", color: "branco", celebration: "Apresentação do Senhor" },
    "02-03": { season: "Tempo Comum", color: "verde", celebration: "S. Brás" },
    "02-04": { season: "Tempo Comum", color: "verde" },
    "02-05": { season: "Tempo Comum", color: "vermelho", celebration: "Sta. Águeda" },
    "02-06": { season: "Tempo Comum", color: "vermelho", celebration: "Ss. Paulo Miki e companheiros" },
    "02-07": { season: "Tempo Comum", color: "verde" },
    "02-08": { season: "Tempo Comum", color: "verde", celebration: "S. Jerônimo Emiliani" },
    "02-09": { season: "Tempo Comum", color: "verde" },
    "02-10": { season: "Tempo Comum", color: "branco", celebration: "Sta. Escolástica" },
    "02-11": { season: "Tempo Comum", color: "branco", celebration: "N. Sra. de Lourdes" },
    "02-12": { season: "Tempo Comum", color: "verde" },
    "02-13": { season: "Tempo Comum", color: "verde" },
    "02-14": { season: "Tempo Comum", color: "vermelho", celebration: "Ss. Cirilo e Metódio" },
    "02-15": { season: "Tempo Comum", color: "verde" },
    "02-16": { season: "Tempo Comum", color: "verde" },
    "02-17": { season: "Tempo Comum", color: "branco", celebration: "7 Santos Fundadores dos Servitas" },
    "02-18": { season: "Quarta-Feira de Cinzas", color: "roxo", celebration: "Quarta-Feira de Cinzas — Início da Quaresma" },
    "02-19": { season: "Quaresma", color: "roxo" },
    "02-20": { season: "Quaresma", color: "roxo" },
    "02-21": { season: "Quaresma", color: "roxo" },
    "02-22": { season: "Quaresma", color: "roxo", celebration: "Cátedra de S. Pedro" },
    "02-23": { season: "Quaresma", color: "roxo", celebration: "S. Polikarpo" },
    "02-24": { season: "Quaresma", color: "roxo" },
    "02-25": { season: "Quaresma", color: "roxo" },
    "02-26": { season: "Quaresma", color: "roxo" },
    "02-27": { season: "Quaresma", color: "roxo" },
    "02-28": { season: "Quaresma", color: "roxo" },

    // Março — Quaresma
    "03-01": { season: "Quaresma", color: "roxo" },
    "03-02": { season: "Quaresma", color: "roxo" },
    "03-03": { season: "Quaresma", color: "roxo" },
    "03-04": { season: "Quaresma", color: "roxo", celebration: "S. Casimiro" },
    "03-05": { season: "Quaresma", color: "roxo" },
    "03-06": { season: "Quaresma", color: "roxo" },
    "03-07": { season: "Quaresma", color: "roxo", celebration: "Sta. Perpétua e Felicidade" },
    "03-08": { season: "Quaresma (3º Dom.)", color: "roxo", celebration: "3.º Domingo da Quaresma" },
    "03-09": { season: "Quaresma", color: "roxo", celebration: "S.ta Francisca Romana" },
    "03-10": { season: "Quaresma", color: "roxo" },
    "03-11": { season: "Quaresma", color: "roxo" },
    "03-12": { season: "Quaresma", color: "roxo" },
    "03-13": { season: "Quaresma", color: "roxo" },
    "03-14": { season: "Quaresma", color: "roxo" },
    "03-15": { season: "Quaresma (4º Dom.)", color: "rosa", celebration: "4.º Domingo da Quaresma (Laetare)" },
    "03-16": { season: "Quaresma", color: "roxo" },
    "03-17": { season: "Quaresma", color: "roxo", celebration: "S. Patrício" },
    "03-18": { season: "Quaresma", color: "roxo", celebration: "S. Cirilo de Jerusalém" },
    "03-19": { season: "Quaresma", color: "branco", celebration: "Solenidade de S. José" },
    "03-20": { season: "Quaresma", color: "roxo" },
    "03-21": { season: "Quaresma", color: "roxo" },
    "03-22": { season: "Quaresma (5º Dom.)", color: "roxo", celebration: "5.º Domingo da Quaresma" },
    "03-23": { season: "Quaresma", color: "roxo", celebration: "S. Turíbio de Mongrovejo" },
    "03-24": { season: "Quaresma", color: "roxo" },
    "03-25": { season: "Anunciação do Senhor", color: "branco", celebration: "Anunciação do Senhor" },
    "03-26": { season: "Quaresma", color: "roxo" },
    "03-27": { season: "Quaresma", color: "roxo" },
    "03-28": { season: "Quaresma", color: "roxo" },
    "03-29": { season: "Domingo de Ramos", color: "vermelho", celebration: "Domingo de Ramos da Paixão do Senhor" },
    "03-30": { season: "Semana Santa", color: "roxo" },
    "03-31": { season: "Semana Santa", color: "roxo" },

    // Abril
    "04-01": { season: "Quarta-Feira Santa", color: "roxo" },
    "04-02": { season: "Quinta-Feira Santa", color: "branco", celebration: "Quinta-Feira Santa — Missa da Ceia" },
    "04-03": { season: "Sexta-Feira Santa", color: "vermelho", celebration: "Paixão do Senhor" },
    "04-04": { season: "Sábado Santo", color: "roxo" },
    "04-05": { season: "Páscoa", color: "branco", celebration: "Solenidade da Páscoa do Senhor" },
    "04-06": { season: "Oitava da Páscoa", color: "branco" },
    "04-07": { season: "Oitava da Páscoa", color: "branco" },
    "04-08": { season: "Oitava da Páscoa", color: "branco" },
    "04-09": { season: "Oitava da Páscoa", color: "branco" },
    "04-10": { season: "Oitava da Páscoa", color: "branco" },
    "04-11": { season: "Oitava da Páscoa", color: "branco", celebration: "S. Estanislau" },
    "04-12": { season: "2.º Dom. Páscoa (Divina Misericórdia)", color: "branco", celebration: "Domingo da Divina Misericórdia" },
    "04-13": { season: "Tempo Pascal", color: "branco", celebration: "S. Martinho I" },
    "04-14": { season: "Tempo Pascal", color: "branco" },
    "04-15": { season: "Tempo Pascal", color: "branco" },
    "04-16": { season: "Tempo Pascal", color: "branco" },
    "04-17": { season: "Tempo Pascal", color: "branco" },
    "04-18": { season: "Tempo Pascal", color: "branco" },
    "04-19": { season: "3.º Dom. da Páscoa", color: "branco" },
    "04-20": { season: "Tempo Pascal", color: "branco" },
    "04-21": { season: "Tempo Pascal", color: "branco" },
    "04-22": { season: "Tempo Pascal", color: "branco" },
    "04-23": { season: "Tempo Pascal", color: "vermelho", celebration: "S. Jorge" },
    "04-24": { season: "Tempo Pascal", color: "branco", celebration: "S. Fidélis de Sigmaringa" },
    "04-25": { season: "Tempo Pascal", color: "vermelho", celebration: "S. Marcos Evangelista" },
    "04-26": { season: "4.º Dom. da Páscoa (Bom Pastor)", color: "branco", celebration: "Domingo do Bom Pastor" },
    "04-27": { season: "Tempo Pascal", color: "branco" },
    "04-28": { season: "Tempo Pascal", color: "branco", celebration: "S. Pedro Chanel" },
    "04-29": { season: "Tempo Pascal", color: "branco", celebration: "Sta. Catarina de Siena" },
    "04-30": { season: "Tempo Pascal", color: "branco", celebration: "S. Pio V" },

    // Maio
    "05-01": { season: "Tempo Pascal", color: "branco", celebration: "S. José Operário" },
    "05-02": { season: "Tempo Pascal", color: "branco", celebration: "S. Ataná­sio" },
    "05-03": { season: "Tempo Pascal", color: "vermelho", celebration: "Ss. Filipe e Tiago Apóstolos" },
    "05-04": { season: "Tempo Pascal", color: "branco" },
    "05-05": { season: "Tempo Pascal", color: "branco" },
    "05-06": { season: "Tempo Pascal", color: "branco" },
    "05-07": { season: "Tempo Pascal", color: "branco" },
    "05-08": { season: "Tempo Pascal", color: "branco" },
    "05-09": { season: "Tempo Pascal", color: "branco" },
    "05-10": { season: "6.º Dom. da Páscoa", color: "branco" },
    "05-11": { season: "Tempo Pascal", color: "branco" },
    "05-12": { season: "Tempo Pascal", color: "vermelho", celebration: "Ss. Nereu e Aquileu" },
    "05-13": { season: "Tempo Pascal", color: "branco", celebration: "N. Sra. de Fátima" },
    "05-14": { season: "Ascensão do Senhor", color: "branco", celebration: "Ascensão do Senhor" },
    "05-15": { season: "Tempo Pascal", color: "branco" },
    "05-16": { season: "Tempo Pascal", color: "branco" },
    "05-17": { season: "7.º Dom. da Páscoa", color: "branco" },
    "05-18": { season: "Tempo Pascal", color: "branco", celebration: "S. João I" },
    "05-19": { season: "Tempo Pascal", color: "branco" },
    "05-20": { season: "Tempo Pascal", color: "branco", celebration: "S. Bernardino de Siena" },
    "05-21": { season: "Tempo Pascal", color: "branco" },
    "05-22": { season: "Tempo Pascal", color: "branco", celebration: "Sta. Rita de Cássia" },
    "05-23": { season: "Tempo Pascal", color: "branco" },
    "05-24": { season: "Pentecostes (Vigília)", color: "vermelho" },
    "05-25": { season: "Pentecostes", color: "vermelho", celebration: "Solenidade de Pentecostes" },
    "05-26": { season: "Tempo Comum", color: "verde", celebration: "Ss. Filipe Neri" },
    "05-27": { season: "Tempo Comum", color: "verde" },
    "05-28": { season: "Tempo Comum", color: "verde" },
    "05-29": { season: "Tempo Comum", color: "verde" },
    "05-30": { season: "Tempo Comum", color: "verde" },
    "05-31": { season: "Visitação de N. Sra.", color: "branco", celebration: "Visitação de Nossa Senhora" },

    // Junho
    "06-01": { season: "Santíssima Trindade", color: "branco", celebration: "Solenidade da Santíssima Trindade" },
    "06-02": { season: "Tempo Comum", color: "verde", celebration: "Ss. Marcelino e Pedro" },
    "06-03": { season: "Tempo Comum", color: "vermelho", celebration: "S. Carlos Lwanga e companheiros" },
    "06-04": { season: "Tempo Comum", color: "verde" },
    "06-05": { season: "Tempo Comum", color: "vermelho", celebration: "S. Bonifácio" },
    "06-06": { season: "Corpus Christi", color: "branco", celebration: "Solenidade do Corpo e Sangue de Cristo" },
    "06-07": { season: "Tempo Comum", color: "verde" },
    "06-08": { season: "Tempo Comum", color: "verde" },
    "06-09": { season: "Tempo Comum", color: "verde" },
    "06-10": { season: "Tempo Comum", color: "verde" },
    "06-11": { season: "Tempo Comum", color: "verde", celebration: "S. Barnabé Apóstolo" },
    "06-12": { season: "Sagrado Coração de Jesus", color: "branco", celebration: "Solenidade do Sagrado Coração de Jesus" },
    "06-13": { season: "Imac. Coração de Maria", color: "branco", celebration: "S. António de Lisboa" },
    "06-14": { season: "Tempo Comum", color: "verde" },
    "06-15": { season: "Tempo Comum", color: "verde" },
    "06-16": { season: "Tempo Comum", color: "verde" },
    "06-17": { season: "Tempo Comum", color: "verde" },
    "06-18": { season: "Tempo Comum", color: "verde" },
    "06-19": { season: "Tempo Comum", color: "verde", celebration: "S. Romualdo" },
    "06-20": { season: "Tempo Comum", color: "verde" },
    "06-21": { season: "Tempo Comum", color: "branco", celebration: "S. Luís Gonzaga" },
    "06-22": { season: "Tempo Comum", color: "verde", celebration: "Ss. João Fisher e Tomás Moro" },
    "06-23": { season: "Tempo Comum", color: "verde" },
    "06-24": { season: "Natividade de S. João Batista", color: "branco", celebration: "Natividade de S. João Batista" },
    "06-25": { season: "Tempo Comum", color: "verde" },
    "06-26": { season: "Tempo Comum", color: "verde" },
    "06-27": { season: "Tempo Comum", color: "verde", celebration: "S. Cirilo de Alexandria" },
    "06-28": { season: "Tempo Comum", color: "branco", celebration: "S. Ireneu" },
    "06-29": { season: "Ss. Pedro e Paulo", color: "vermelho", celebration: "Solenidade dos Ss. Pedro e Paulo" },
    "06-30": { season: "Primeiros Mártires de Roma", color: "vermelho" },

    // Julho
    "07-01": { season: "Tempo Comum", color: "verde" },
    "07-02": { season: "Tempo Comum", color: "verde" },
    "07-03": { season: "Tempo Comum", color: "vermelho", celebration: "S. Tomás Apóstolo" },
    "07-04": { season: "Tempo Comum", color: "verde" },
    "07-05": { season: "Tempo Comum", color: "branco", celebration: "S. António M. Zaccaria" },
    "07-06": { season: "Tempo Comum", color: "branco", celebration: "Sta. Maria Goretti" },
    "07-07": { season: "Tempo Comum", color: "verde" },
    "07-08": { season: "Tempo Comum", color: "verde" },
    "07-09": { season: "Tempo Comum", color: "vermelho", celebration: "Ss. Agostinho Zhao Rong e companheiros" },
    "07-10": { season: "Tempo Comum", color: "verde" },
    "07-11": { season: "Tempo Comum", color: "branco", celebration: "S. Bento Abade" },
    "07-12": { season: "Tempo Comum", color: "verde" },
    "07-13": { season: "Tempo Comum", color: "branco", celebration: "S. Henrique" },
    "07-14": { season: "Tempo Comum", color: "branco", celebration: "S. Camilo de Lélis" },
    "07-15": { season: "Tempo Comum", color: "branco", celebration: "S. Boaventura" },
    "07-16": { season: "Tempo Comum", color: "branco", celebration: "N. Sra. do Carmo" },
    "07-17": { season: "Tempo Comum", color: "verde" },
    "07-18": { season: "Tempo Comum", color: "verde" },
    "07-19": { season: "Tempo Comum", color: "verde" },
    "07-20": { season: "Tempo Comum", color: "verde" },
    "07-21": { season: "Tempo Comum", color: "verde" },
    "07-22": { season: "Tempo Comum", color: "branco", celebration: "Sta. Maria Madalena" },
    "07-23": { season: "Tempo Comum", color: "branco", celebration: "Sta. Brígida" },
    "07-24": { season: "Tempo Comum", color: "verde", celebration: "S. Xisto II" },
    "07-25": { season: "Tempo Comum", color: "vermelho", celebration: "S. Tiago Apóstolo" },
    "07-26": { season: "Tempo Comum", color: "branco", celebration: "Ss. Joaquim e Ana" },
    "07-27": { season: "Tempo Comum", color: "verde" },
    "07-28": { season: "Tempo Comum", color: "verde" },
    "07-29": { season: "Tempo Comum", color: "branco", celebration: "Ss. Marta, Maria e Lázaro" },
    "07-30": { season: "Tempo Comum", color: "branco", celebration: "S. Pedro Crisólogo" },
    "07-31": { season: "Tempo Comum", color: "branco", celebration: "S. Inácio de Loyola" },

    // Agosto
    "08-01": { season: "Tempo Comum", color: "branco", celebration: "S. Afonso Maria de Ligório" },
    "08-02": { season: "Tempo Comum", color: "verde" },
    "08-03": { season: "Tempo Comum", color: "verde" },
    "08-04": { season: "Tempo Comum", color: "branco", celebration: "S. João Maria Vianney" },
    "08-05": { season: "Tempo Comum", color: "branco", celebration: "Dedicação da Basílica de S. Maria" },
    "08-06": { season: "Transfiguração do Senhor", color: "branco", celebration: "Transfiguração do Senhor" },
    "08-07": { season: "Tempo Comum", color: "verde", celebration: "Ss. Sisto II e companheiros" },
    "08-08": { season: "Tempo Comum", color: "branco", celebration: "S. Domingos" },
    "08-09": { season: "Tempo Comum", color: "vermelho", celebration: "Sta. Teresa Benedita da Cruz" },
    "08-10": { season: "Tempo Comum", color: "vermelho", celebration: "S. Lourenço Mártir" },
    "08-11": { season: "Tempo Comum", color: "branco", celebration: "Sta. Clara" },
    "08-12": { season: "Tempo Comum", color: "verde" },
    "08-13": { season: "Tempo Comum", color: "verde" },
    "08-14": { season: "Vigília da Assunção", color: "branco" },
    "08-15": { season: "Assunção de N. Sra.", color: "branco", celebration: "Solenidade da Assunção de Nossa Senhora" },
    "08-16": { season: "Tempo Comum", color: "verde", celebration: "S. Estêvão da Hungria" },
    "08-17": { season: "Tempo Comum", color: "verde" },
    "08-18": { season: "Tempo Comum", color: "verde" },
    "08-19": { season: "Tempo Comum", color: "branco", celebration: "S. João Eudes" },
    "08-20": { season: "Tempo Comum", color: "branco", celebration: "S. Bernardo de Claraval" },
    "08-21": { season: "Tempo Comum", color: "branco", celebration: "Sta. Pio X" },
    "08-22": { season: "Tempo Comum", color: "branco", celebration: "Maria Rainha" },
    "08-23": { season: "Tempo Comum", color: "branco", celebration: "Sta. Rosa de Lima" },
    "08-24": { season: "Tempo Comum", color: "vermelho", celebration: "S. Bartolomeu Apóstolo" },
    "08-25": { season: "Tempo Comum", color: "verde", celebration: "S. Luís de França" },
    "08-26": { season: "Tempo Comum", color: "verde" },
    "08-27": { season: "Tempo Comum", color: "branco", celebration: "Sta. Mônica" },
    "08-28": { season: "Tempo Comum", color: "branco", celebration: "S. Agostinho" },
    "08-29": { season: "Tempo Comum", color: "vermelho", celebration: "Martírio de S. João Batista" },
    "08-30": { season: "Tempo Comum", color: "verde" },
    "08-31": { season: "Tempo Comum", color: "verde" },

    // Setembro
    "09-01": { season: "Tempo Comum", color: "verde" },
    "09-02": { season: "Tempo Comum", color: "verde" },
    "09-03": { season: "Tempo Comum", color: "branco", celebration: "S. Gregório Magno" },
    "09-04": { season: "Tempo Comum", color: "verde" },
    "09-05": { season: "Tempo Comum", color: "verde" },
    "09-06": { season: "Tempo Comum", color: "verde" },
    "09-07": { season: "Tempo Comum", color: "verde" },
    "09-08": { season: "Natividade de N. Sra.", color: "branco", celebration: "Natividade de Nossa Senhora" },
    "09-09": { season: "Tempo Comum", color: "verde", celebration: "S. Pedro Claver" },
    "09-10": { season: "Tempo Comum", color: "verde" },
    "09-11": { season: "Tempo Comum", color: "verde" },
    "09-12": { season: "Tempo Comum", color: "branco", celebration: "Ss. Nome de Maria" },
    "09-13": { season: "Tempo Comum", color: "branco", celebration: "S. João Crisóstomo" },
    "09-14": { season: "Exaltação da S. Cruz", color: "vermelho", celebration: "Exaltação da Santa Cruz" },
    "09-15": { season: "Tempo Comum", color: "branco", celebration: "N. Sra. das Dores" },
    "09-16": { season: "Tempo Comum", color: "vermelho", celebration: "Ss. Cornélio e Cipriano" },
    "09-17": { season: "Tempo Comum", color: "branco", celebration: "S. Roberto Bellarmino" },
    "09-18": { season: "Tempo Comum", color: "verde" },
    "09-19": { season: "Tempo Comum", color: "verde", celebration: "S. Januário" },
    "09-20": { season: "Tempo Comum", color: "vermelho", celebration: "Ss. André Kim Tae-gon e Paulo Chong Ha-sang" },
    "09-21": { season: "Tempo Comum", color: "vermelho", celebration: "S. Mateus Evangelista" },
    "09-22": { season: "Tempo Comum", color: "verde" },
    "09-23": { season: "Tempo Comum", color: "branco", celebration: "S. Padre Pio de Pietrelcina" },
    "09-24": { season: "Tempo Comum", color: "verde" },
    "09-25": { season: "Tempo Comum", color: "verde" },
    "09-26": { season: "Tempo Comum", color: "verde" },
    "09-27": { season: "Tempo Comum", color: "branco", celebration: "S. Vicente de Paulo" },
    "09-28": { season: "Tempo Comum", color: "verde", celebration: "S. Venceslau" },
    "09-29": { season: "Tempo Comum", color: "branco", celebration: "Ss. Arcanjos Miguel, Gabriel e Rafael" },
    "09-30": { season: "Tempo Comum", color: "branco", celebration: "S. Jerônimo" },

    // Outubro
    "10-01": { season: "Tempo Comum", color: "branco", celebration: "Sta. Teresa do Menino Jesus" },
    "10-02": { season: "Tempo Comum", color: "branco", celebration: "Ss. Anjos da Guarda" },
    "10-03": { season: "Tempo Comum", color: "verde" },
    "10-04": { season: "Tempo Comum", color: "branco", celebration: "S. Francisco de Assis" },
    "10-05": { season: "Tempo Comum", color: "verde" },
    "10-06": { season: "Tempo Comum", color: "verde", celebration: "S. Bruno" },
    "10-07": { season: "Tempo Comum", color: "branco", celebration: "N. Sra. do Rosário" },
    "10-08": { season: "Tempo Comum", color: "verde" },
    "10-09": { season: "Tempo Comum", color: "verde", celebration: "S. Dionísio e companheiros" },
    "10-10": { season: "Tempo Comum", color: "verde" },
    "10-11": { season: "Tempo Comum", color: "verde" },
    "10-12": { season: "N. Sra. Aparecida", color: "branco", celebration: "N. Sra. Aparecida — Padroeira do Brasil" },
    "10-13": { season: "Tempo Comum", color: "verde" },
    "10-14": { season: "Tempo Comum", color: "verde", celebration: "S. Calisto I" },
    "10-15": { season: "Tempo Comum", color: "branco", celebration: "Sta. Teresa de Ávila" },
    "10-16": { season: "Tempo Comum", color: "verde", celebration: "Sta. Margarida Maria Alacoque" },
    "10-17": { season: "Tempo Comum", color: "vermelho", celebration: "S. Inácio de Antioquia" },
    "10-18": { season: "Tempo Comum", color: "vermelho", celebration: "S. Lucas Evangelista" },
    "10-19": { season: "Tempo Comum", color: "vermelho", celebration: "Ss. João de Brébeuf, Isaac Jogues e companheiros" },
    "10-20": { season: "Tempo Comum", color: "verde" },
    "10-21": { season: "Tempo Comum", color: "verde" },
    "10-22": { season: "Tempo Comum", color: "verde", celebration: "S. João Paulo II" },
    "10-23": { season: "Tempo Comum", color: "verde", celebration: "S. João de Capistrano" },
    "10-24": { season: "Tempo Comum", color: "verde", celebration: "S. Antônio Maria Claret" },
    "10-25": { season: "Tempo Comum", color: "verde" },
    "10-26": { season: "Tempo Comum", color: "verde" },
    "10-27": { season: "Tempo Comum", color: "verde" },
    "10-28": { season: "Tempo Comum", color: "vermelho", celebration: "Ss. Simão e Judas Apóstolos" },
    "10-29": { season: "Tempo Comum", color: "verde" },
    "10-30": { season: "Tempo Comum", color: "verde" },
    "10-31": { season: "Tempo Comum", color: "verde" },

    // Novembro
    "11-01": { season: "Todos os Santos", color: "branco", celebration: "Solenidade de Todos os Santos" },
    "11-02": { season: "Fiéis Defuntos", color: "roxo", celebration: "Comemoração de Todos os Fiéis Defuntos" },
    "11-03": { season: "Tempo Comum", color: "verde" },
    "11-04": { season: "Tempo Comum", color: "branco", celebration: "S. Carlos Borromeo" },
    "11-05": { season: "Tempo Comum", color: "verde" },
    "11-06": { season: "Tempo Comum", color: "verde" },
    "11-07": { season: "Tempo Comum", color: "verde" },
    "11-08": { season: "Tempo Comum", color: "verde" },
    "11-09": { season: "Dedicação da Basílica de Latrão", color: "branco", celebration: "Dedicação da Basílica de Latrão" },
    "11-10": { season: "Tempo Comum", color: "branco", celebration: "S. Leão Magno" },
    "11-11": { season: "Tempo Comum", color: "branco", celebration: "S. Martinho de Tours" },
    "11-12": { season: "Tempo Comum", color: "branco", celebration: "S. Josafá" },
    "11-13": { season: "Tempo Comum", color: "verde" },
    "11-14": { season: "Tempo Comum", color: "verde" },
    "11-15": { season: "Tempo Comum", color: "branco", celebration: "S. Alberto Magno" },
    "11-16": { season: "Tempo Comum", color: "verde" },
    "11-17": { season: "Tempo Comum", color: "branco", celebration: "Sta. Isabel da Hungria" },
    "11-18": { season: "Tempo Comum", color: "verde" },
    "11-19": { season: "Tempo Comum", color: "verde" },
    "11-20": { season: "Tempo Comum", color: "verde" },
    "11-21": { season: "Apresentação de N. Sra.", color: "branco", celebration: "Apresentação de Nossa Senhora" },
    "11-22": { season: "Tempo Comum", color: "vermelho", celebration: "Sta. Cecília" },
    "11-23": { season: "Tempo Comum", color: "verde", celebration: "S. Clemente I" },
    "11-24": { season: "Tempo Comum", color: "vermelho", celebration: "Ss. André Dung-Lac e companheiros" },
    "11-25": { season: "Tempo Comum", color: "verde", celebration: "Sta. Catarina de Alexandria" },
    "11-26": { season: "Tempo Comum", color: "verde" },
    "11-27": { season: "Tempo Comum", color: "verde" },
    "11-28": { season: "Tempo Comum", color: "verde" },
    "11-29": { season: "Cristo Rei (último Dom. Comum)", color: "branco", celebration: "Solenidade de Cristo Rei do Universo" },
    "11-30": { season: "Advento", color: "roxo", celebration: "S. André Apóstolo" },

    // Dezembro — Advento e Natal
    "12-01": { season: "Advento", color: "roxo" },
    "12-02": { season: "Advento", color: "roxo" },
    "12-03": { season: "Advento", color: "roxo", celebration: "S. Francisco Xavier" },
    "12-04": { season: "Advento", color: "roxo", celebration: "S. João Damasceno" },
    "12-05": { season: "Advento", color: "roxo" },
    "12-06": { season: "Advento", color: "roxo", celebration: "S. Nicolau" },
    "12-07": { season: "Advento (2º Dom.)", color: "roxo", celebration: "S. Ambrósio" },
    "12-08": { season: "Imaculada Conceição", color: "branco", celebration: "Solenidade da Imaculada Conceição" },
    "12-09": { season: "Advento", color: "roxo" },
    "12-10": { season: "Advento", color: "roxo" },
    "12-11": { season: "Advento", color: "roxo", celebration: "S. Dâmaso I" },
    "12-12": { season: "Advento", color: "roxo", celebration: "N. Sra. de Guadalupe" },
    "12-13": { season: "Advento", color: "roxo", celebration: "Sta. Luzia" },
    "12-14": { season: "Advento (3º Dom. — Gaudete)", color: "rosa", celebration: "S. João da Cruz" },
    "12-15": { season: "Advento", color: "roxo" },
    "12-16": { season: "Advento", color: "roxo" },
    "12-17": { season: "Advento (Maior Antífona)", color: "roxo" },
    "12-18": { season: "Advento (Maior Antífona)", color: "roxo" },
    "12-19": { season: "Advento (Maior Antífona)", color: "roxo" },
    "12-20": { season: "Advento (Maior Antífona)", color: "roxo" },
    "12-21": { season: "Advento (4º Dom.)", color: "roxo" },
    "12-22": { season: "Advento (Maior Antífona)", color: "roxo" },
    "12-23": { season: "Advento (Maior Antífona)", color: "roxo" },
    "12-24": { season: "Vigília de Natal", color: "branco", celebration: "Vigília do Natal do Senhor" },
    "12-25": { season: "Natal do Senhor", color: "branco", celebration: "Solenidade do Natal do Senhor" },
    "12-26": { season: "Tempo do Natal", color: "vermelho", celebration: "S. Estêvão Protomártir" },
    "12-27": { season: "Tempo do Natal", color: "branco", celebration: "S. João Evangelista" },
    "12-28": { season: "Tempo do Natal", color: "vermelho", celebration: "Ss. Inocentes Mártires" },
    "12-29": { season: "Tempo do Natal", color: "branco", celebration: "S. Tomás Becket" },
    "12-30": { season: "Sagrada Família", color: "branco", celebration: "Sagrada Família de Jesus, Maria e José" },
    "12-31": { season: "Tempo do Natal", color: "branco", celebration: "S. Silvestre I" },
};

// ── HELPERS ─────────────────────────────────────────────────────────────────
const COLOR_META: Record<LiturgicalColor, { hex: string; bg: string; label: string }> = {
    roxo: { hex: "#6d28d9", bg: "#ede9fe", label: "Roxo" },
    verde: { hex: "#15803d", bg: "#dcfce7", label: "Verde" },
    branco: { hex: "#d97706", bg: "#fef3c7", label: "Branco" },
    vermelho: { hex: "#b91c1c", bg: "#fee2e2", label: "Vermelho" },
    rosa: { hex: "#be185d", bg: "#fce7f3", label: "Rosa" },
};

function getDateKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}-${day}`;
}

function getToday(): Date {
    // Data de hoje no timezone de Brasília
    const now = new Date();
    const br = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    return new Date(br.getFullYear(), br.getMonth(), br.getDate());
}

// ── COMPONENTE ───────────────────────────────────────────────────────────────
export function LiturgicalCalendar() {
    const today = useMemo(() => getToday(), []);
    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const isToday = selectedDate.toDateString() === today.toDateString();

    // Formata a data para o input type="date" (YYYY-MM-DD)
    const inputValue = [
        selectedDate.getFullYear(),
        String(selectedDate.getMonth() + 1).padStart(2, "0"),
        String(selectedDate.getDate()).padStart(2, "0"),
    ].join("-");

    const goNext = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    };

    const goPrev = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };

    const { dayData, dateLabel } = useMemo(() => {
        const key = getDateKey(selectedDate);
        const data = LITURGICAL_DATA_2026[key] ?? { season: "Tempo Comum", color: "verde" as LiturgicalColor };
        const label = selectedDate.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
        return { dayData: data, dateLabel: label };
    }, [selectedDate]);

    const meta = COLOR_META[dayData.color];

    return (
        <div style={{ padding: "20px 15px", display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Navegação de datas */}
            <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "white", borderRadius: "50px", padding: "6px 10px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            }}>
                <button onClick={goPrev} style={{
                    border: "none", background: "#f3f4f6", borderRadius: "50%",
                    width: 36, height: 36, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0,
                }}>◀</button>

                {/* Input date oculto — abre o seletor nativo ao clicar no botão 📅 */}
                <input
                    ref={dateInputRef}
                    type="date"
                    value={inputValue}
                    min="2026-01-01"
                    max="2026-12-31"
                    onChange={(e) => {
                        if (!e.target.value) return;
                        const [y, m, d] = e.target.value.split("-").map(Number);
                        setSelectedDate(new Date(y, m - 1, d));
                    }}
                    style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                />

                <div style={{ flex: 1, textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: "700", color: "#1a1a2e", textTransform: "capitalize" }}>
                        {dateLabel}
                    </p>
                </div>

                {/* Botão calendário */}
                <button onClick={() => dateInputRef.current?.showPicker()} style={{
                    border: "none", background: "#f3f4f6", borderRadius: "50%",
                    width: 36, height: 36, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0,
                }} title="Escolher data">📅</button>

                <button onClick={goNext} style={{
                    border: "none", background: "#f3f4f6", borderRadius: "50%",
                    width: 36, height: 36, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0,
                }}>▶</button>

                {!isToday && (
                    <button onClick={() => setSelectedDate(today)} style={{
                        border: "none", background: "#e0e7ff", color: "#3730a3",
                        borderRadius: "20px", padding: "4px 12px", fontSize: "0.75rem",
                        fontWeight: "bold", cursor: "pointer", flexShrink: 0,
                    }}>Hoje</button>
                )}
            </div>

            {/* Card principal */}
            <div style={{
                background: `linear-gradient(135deg, ${meta.hex}, ${meta.hex}cc)`,
                color: "white",
                borderRadius: "16px",
                padding: "24px 20px",
                textAlign: "center",
                boxShadow: `0 4px 20px ${meta.hex}44`,
            }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>✝</div>
                <h2 style={{ margin: "0 0 10px", fontSize: "1.3rem", fontWeight: 800 }}>{dayData.season}</h2>
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "rgba(255,255,255,0.25)", borderRadius: "30px", padding: "6px 16px",
                }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "white" }} />
                    <span style={{ fontSize: "0.9rem", fontWeight: "bold" }}>Cor: {meta.label}</span>
                </div>
            </div>

            {/* Santo / Celebração do dia */}
            <div style={{
                background: meta.bg,
                border: `1px solid ${meta.hex}44`,
                borderLeft: `4px solid ${meta.hex}`,
                borderRadius: "12px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
            }}>
                <span style={{ fontSize: "1.8rem" }}>{dayData.celebration ? "🌹" : "✝"}</span>
                <div>
                    <p style={{ margin: "0 0 2px", fontSize: "0.75rem", color: meta.hex, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {dayData.celebration ? "Celebração do Dia" : "Dia de Feria"}
                    </p>
                    <p style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "#1a1a2e" }}>
                        {dayData.celebration ?? "Dia comum sem memória obrigatória"}
                    </p>
                    {!dayData.celebration && (
                        <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#666", fontStyle: "italic" }}>
                            Neste dia, celebra-se a missa do tempo litúrgico vigente.
                        </p>
                    )}
                </div>
            </div>


            {/* Sobre o tempo litúrgico */}
            <div style={{
                background: "white",
                border: `1px solid ${theme.colors.border}`,
                borderRadius: "12px",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
            }}>
                <p style={{ margin: 0, fontWeight: "bold", fontSize: "0.9rem", color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>📋 Sobre o Tempo Litúrgico</p>
                <LiturgicalInfo color={dayData.color} />
            </div>

            <p style={{ textAlign: "center", fontSize: "0.72rem", color: theme.colors.textMuted, margin: 0 }}>
                Calendário Litúrgico Romano • Ano Litúrgico 2025–2026
            </p>
        </div>
    );
}

function LiturgicalInfo({ color }: { color: LiturgicalColor }) {
    const infos: Record<LiturgicalColor, string> = {
        roxo: "O roxo é a cor do recolhimento, da penitência e da conversão. Usado no Advento e na Quaresma, convida ao preparo interior, à oração e ao jejum.",
        verde: "O verde simboliza esperança e vida. É usado durante o Tempo Comum, quando a Igreja aprofunda o ensinamento do Evangelho no cotidiano dos fiéis.",
        branco: "O branco representa a pureza, a alegria e a glória. Usado nas solenidades do Senhor, de Nossa Senhora e dos santos não mártires.",
        vermelho: "O vermelho recorda o fogo do Espírito Santo e o sangue dos mártires. Usado em Pentecostes e nas festas dos apóstolos e mártires.",
        rosa: "O rosa é uma atenuação do roxo, sinal de alegria no meio da espera. Usado no 3.º Domingo do Advento (Gaudete) e no 4.º Domingo da Quaresma (Laetare).",
    };
    return <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.6, color: "#444" }}>{infos[color]}</p>;
}

