import { useMemo, useState, useRef } from "react";
import { theme } from "../theme/theme";

// ── TIPOS ───────────────────────────────────────────────────────────────────
type LiturgicalColor = "roxo" | "verde" | "branco" | "vermelho" | "rosa";
interface DayData {
    season: string;
    color: LiturgicalColor;
    celebration?: string;
    history?: string;
}

// ── DADOS DE 2026 ───────────────────────────────────────────────────────────
// Chave: "MM-DD"
const LITURGICAL_DATA_2026: Record<string, DayData> = {
    // Janeiro — Tempo do Natal / Tempo Comum
    "01-01": { season: "Solenidade de Maria Mãe de Deus", color: "branco", celebration: "Solenidade de Maria, Mãe de Deus" },
    "01-02": {
        season: "Tempo do Natal",
        color: "branco",
        celebration: "Ss. Basílio Magno e Gregório Nazianzeno",
        history: "Basílio e Gregório foram grandes amigos e bispos do século IV. Basílio é conhecido como o pai do monaquismo oriental e defensor da divindade do Espírito Santo. Gregório, chamado 'o Teólogo', destacou-se por sua eloquência na defesa da fé trinitária."
    },
    "01-03": { season: "Tempo do Natal", color: "branco", celebration: "Ss. Nome de Jesus" },
    "01-04": { season: "Tempo do Natal", color: "branco" },
    "01-05": { season: "Tempo do Natal", color: "branco" },
    "01-06": { season: "Epifania do Senhor", color: "branco", celebration: "Solenidade da Epifania do Senhor" },
    "01-07": {
        season: "Tempo Comum",
        color: "verde",
        celebration: "S. Raimundo de Penafort",
        history: "Padroeiro dos canonistas, foi um mestre do Direito Canônico e confessor de papas. Ajudou na fundação da Ordem das Mercês e trabalhou incansavelmente pela salvação das almas através da confessção e do ensino."
    },
    "01-08": { season: "Batismo do Senhor", color: "branco", celebration: "Batismo do Senhor" },
    "01-09": { season: "Tempo Comum", color: "verde" },
    "01-10": { season: "Tempo Comum", color: "verde" },
    "01-11": { season: "Tempo Comum", color: "verde" },
    "01-12": { season: "Tempo Comum", color: "verde" },
    "01-13": {
        season: "Tempo Comum",
        color: "verde",
        celebration: "S. Hilário",
        history: "Bispo de Poitiers e Doutor da Igreja, ficou conhecido como o 'Atanásio do Ocidente' por sua firme defesa da divindade de Cristo contra a heresia ariana no século IV."
    },
    "01-14": { season: "Tempo Comum", color: "verde" },
    "01-15": { season: "Tempo Comum", color: "verde" },
    "01-16": { season: "Tempo Comum", color: "verde" },
    "01-17": {
        season: "Tempo Comum",
        color: "verde",
        celebration: "S. Antônio do Deserto",
        history: "Conhecido como o 'Pai dos Monges', foi um eremita egípcio que viveu no deserto. Sua busca por Deus em total renúncia e oração inspirou o monaquismo cristão oriental e ocidental."
    },
    "01-18": { season: "Semana de Oração pela Unidade", color: "verde" },
    "01-19": { season: "Tempo Comum", color: "verde" },
    "01-20": {
        season: "Tempo Comum",
        color: "verde",
        celebration: "Ss. Fabiano e Sebastião",
        history: "Mártires de Roma. Sebastião, soldado imperial, foi executado por sua fidelidade a Cristo, tornando-se símbolo de coragem. Fabiano foi um papa dedicado que organizou a igreja romana antes de seu martírio."
    },
    "01-21": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "Sta. Inês",
        history: "Jovem mártir romana de apenas 12 ou 13 anos. Consagrou sua virgindade a Cristo e enfrentou o martírio com bravura inabalável, sendo hoje padroeira das jovens e da pureza."
    },
    "01-22": { season: "Tempo Comum", color: "verde" },
    "01-23": { season: "Tempo Comum", color: "verde" },
    "01-24": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Francisco de Sales",
        history: "Bispo de Genebra e Doutor da Igreja. Conhecido por sua bondade e suavidade, é o padroeiro dos jornalistas e escritores. Ensinou que a santidade é possível a todos no cotidiano."
    },
    "01-25": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "Conversão de S. Paulo",
        history: "Celebra o encontro transformador de Saulo, o perseguidor, com Cristo no caminho de Damasco. Tornou-se o 'Apóstolo das Nações', o maior missionário da história cristã."
    },
    "01-26": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "Ss. Timóteo e Tito",
        history: "Discípulos e colaboradores próximos de São Paulo. Timóteo foi bispo de Éfeso e Tito de Creta, exemplos de pastores fiéis que ajudaram a estruturar as primeiras igrejas."
    },
    "01-27": { season: "Tempo Comum", color: "verde" },
    "01-28": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Tomás de Aquino",
        history: "O 'Doutor Angélico', um dos maiores filósofos e teólogos da cristandade. Sua 'Suma Teológica' é pilar da doutrina. É o padroeiro dos estudantes e das escolas católicas."
    },
    "01-29": { season: "Tempo Comum", color: "verde" },
    "01-30": { season: "Tempo Comum", color: "verde" },
    "01-31": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. João Bosco",
        history: "O 'Pai e Mestre da Juventude'. Fundou a Família Salesiana e dedicou-se inteiramente à educação dos jovens pobres através do seu sistema preventivo baseado no amor e na alegria."
    },

    // Fevereiro
    "02-01": { season: "Tempo Comum", color: "verde" },
    "02-02": {
        season: "Apresentação do Senhor",
        color: "branco",
        celebration: "Apresentação do Senhor",
        history: "Recorda o momento em que Maria e José apresentaram Jesus no Templo, 40 dias após o Natal. Simeão o proclama como a 'Luz das Nações'. É também o Dia Mundial da Vida Consagrada."
    },
    "02-03": {
        season: "Tempo Comum",
        color: "verde",
        celebration: "S. Brás",
        history: "Bispo e mártir, é invocado como protetor contra as doenças da garganta. A tradição conta que ele salvou um menino que se asfixiava com uma espinha de peixe."
    },
    "02-04": { season: "Tempo Comum", color: "verde" },
    "02-05": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "Sta. Águeda",
        history: "Mártir siciliana que manteve sua consagração a Cristo apesar das torturas. É considerada protetora contra incêndios e doenças no seio."
    },
    "02-06": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "Ss. Paulo Miki e companheiros",
        history: "Foram os primeiros mártires do Japão, crucificados em Nagasaki por pregarem o Evangelho. Morreram perdoando seus executores e louvando a Deus."
    },
    "02-07": { season: "Tempo Comum", color: "verde" },
    "02-08": { season: "Tempo Comum", color: "verde", celebration: "S. Jerônimo Emiliani" },
    "02-09": { season: "Tempo Comum", color: "verde" },
    "02-10": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "Sta. Escolástica",
        history: "Irmã de São Bento, dedicou-se à vida religiosa seguindo a Regra Beneditina. É a padroeira das monjas beneditinas e exemplo de amizade espiritual e oração fervorosa."
    },
    "02-11": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "N. Sra. de Lourdes",
        history: "Celebra as aparições da Virgem Maria a Santa Bernadete em 1858. O local tornou-se um santuário de cura e esperança. É também o Dia Mundial do Enfermo."
    },
    "02-12": { season: "Tempo Comum", color: "verde" },
    "02-13": { season: "Tempo Comum", color: "verde" },
    "02-14": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "Ss. Cirilo e Metódio",
        history: "Irmãos e missionários que evangelizaram os povos eslavos. São os 'Apóstolos dos Eslavos' e co-padroeiros da Europa por terem unido o Evangelho à cultura dos povos."
    },
    "02-15": { season: "Tempo Comum", color: "verde" },
    "02-16": { season: "Tempo Comum", color: "verde" },
    "02-17": { season: "Tempo Comum", color: "branco", celebration: "7 Santos Fundadores dos Servitas" },
    "02-18": {
        season: "Quarta-Feira de Cinzas",
        color: "roxo",
        celebration: "Quarta-Feira de Cinzas — Início da Quaresma",
        history: "Dia de jejum e abstinência. Com a imposição das cinzas, iniciamos os 40 dias de preparação para a Páscoa, focados em oração, penitência e caridade."
    },
    "02-19": { season: "Quaresma", color: "roxo" },
    "02-20": { season: "Quaresma", color: "roxo" },
    "02-21": { season: "Quaresma", color: "roxo" },
    "02-22": {
        season: "Quaresma",
        color: "roxo",
        celebration: "Cátedra de S. Pedro",
        history: "Festa que celebra o magistério de São Pedro e a autoridade do Papa como sucessor do apóstolo e sinal visível de unidade da Igreja em todo o mundo."
    },
    "02-23": {
        season: "Quaresma",
        color: "roxo",
        celebration: "S. Polikarpo",
        history: "Bispo de Esmirna e discípulo do apóstolo São João. Um dos primeiros 'Padres da Igreja', morreu mártir na fogueira por recusar-se a negar a sua fé em Cristo."
    },
    "02-24": { season: "Quaresma", color: "roxo" },
    "02-25": { season: "Quaresma", color: "roxo" },
    "02-26": { season: "Quaresma", color: "roxo" },
    "02-27": { season: "Quaresma", color: "roxo" },
    "02-28": { season: "Quaresma", color: "roxo" },

    // Março — Quaresma
    "03-01": { season: "Quaresma", color: "roxo" },
    "03-02": { season: "Quaresma", color: "roxo" },
    "03-03": { season: "Quaresma", color: "roxo" },
    "03-04": {
        season: "Quaresma",
        color: "roxo",
        celebration: "S. Casimiro",
        history: "Príncipe da Polônia, Casimiro brilhou por sua pureza, humildade e amor aos pobres. Preferiu o serviço a Deus e o estudo à glória do reino terreno, sendo um modelo de jovem santo."
    },
    "03-05": { season: "Quaresma", color: "roxo" },
    "03-06": { season: "Quaresma", color: "roxo" },
    "03-07": {
        season: "Quaresma",
        color: "roxo",
        celebration: "Ss. Perpétua e Felicidade",
        history: "Mártires africanas do século III. Perpétua, jovem nobre, e Felicidade, sua escrava, deram testemunho de fé inabalável no anfiteatro de Cartago, unidas pelo mesmo amor a Cristo."
    },
    "03-08": {
        season: "Quaresma (3º Dom.)",
        color: "roxo",
        celebration: "3.º Domingo da Quaresma",
        history: "Neste domingo, a Igreja nos convida a aprofundar nossa conversão. A liturgia nos recorda a importância de purificar o templo do nosso coração para acolher o Deus Vivo."
    },
    "03-09": {
        season: "Quaresma",
        color: "roxo",
        celebration: "Sta. Francisca Romana",
        history: "Esposa e mãe exemplar, dedicou-se à caridade e à oração em Roma. Fundou uma congregação de oblatas e era conhecida por sua íntima ligação com seu anjo da guarda."
    },
    "03-10": { season: "Quaresma", color: "roxo" },
    "03-11": { season: "Quaresma", color: "roxo" },
    "03-12": { season: "Quaresma", color: "roxo" },
    "03-13": { season: "Quaresma", color: "roxo" },
    "03-14": { season: "Quaresma", color: "roxo" },
    "03-15": { season: "Quaresma (4º Dom.)", color: "rosa", celebration: "4.º Domingo da Quaresma (Laetare)" },
    "03-16": { season: "Quaresma", color: "roxo" },
    "03-17": {
        season: "Quaresma",
        color: "roxo",
        celebration: "S. Patrício",
        history: "O 'Apóstolo da Irlanda'. Após ser escravizado, fugiu, tornou-se bispo e retornou à Irlanda para converter o povo celta, usando o trevo para explicar o mistério da Santíssima Trindade."
    },
    "03-18": {
        season: "Quaresma",
        color: "roxo",
        celebration: "S. Cirilo de Jerusalém",
        history: "Bispo de Jerusalém e Doutor da Igreja. Suas 'Catequeses' são tesouros da doutrina sobre os sacramentos. Sofreu perseguições e exílios por sua defesa da fé cristã."
    },
    "03-19": {
        season: "Solenidade de S. José",
        color: "branco",
        celebration: "S. José, Esposo de Maria",
        history: "O justo e silencioso guardião da Sagrada Família. Padroeiro universal da Igreja, dos trabalhadores e dos pais. Exemplo de obediência fiel aos planos de Deus."
    },
    "03-20": { season: "Quaresma", color: "roxo" },
    "03-21": { season: "Quaresma", color: "roxo" },
    "03-22": { season: "Quaresma (5º Dom.)", color: "roxo", celebration: "5.º Domingo da Quaresma" },
    "03-23": {
        season: "Quaresma",
        color: "roxo",
        celebration: "S. Turíbio de Mongrovejo",
        history: "Arcebispo de Lima e grande missionário na América Latina. Percorreu milhares de quilômetros para evangelizar os indígenas, defender seus direitos e organizar a Igreja no Peru."
    },
    "03-24": { season: "Quaresma", color: "roxo" },
    "03-25": {
        season: "Anunciação do Senhor",
        color: "branco",
        celebration: "Anunciação do Senhor",
        history: "Celebra o momento em que o Arcanjo Gabriel anuncia a Maria que ela será a Mãe do Salvador. O 'Sim' de Maria mudou a história da humanidade, trazendo o Verbo Encarnado."
    },
    "03-26": { season: "Quaresma", color: "roxo" },
    "03-27": { season: "Quaresma", color: "roxo" },
    "03-28": { season: "Quaresma", color: "roxo" },
    "03-29": {
        season: "Domingo de Ramos",
        color: "vermelho",
        celebration: "Domingo de Ramos da Paixão do Senhor",
        history: "Entrada solene de Jesus em Jerusalém. A bênção dos ramos nos recorda que somos chamados a seguir o Senhor não apenas na alegria do triunfo, mas também no caminho da Cruz."
    },
    "03-30": { season: "Semana Santa", color: "roxo" },
    "03-31": { season: "Semana Santa", color: "roxo" },

    // Abril
    "04-01": { season: "Quarta-Feira Santa", color: "roxo" },
    "04-02": {
        season: "Quinta-Feira Santa",
        color: "branco",
        celebration: "Quinta-Feira Santa — Missa da Ceia",
        history: "Instituição da Eucaristia e do Sacerdócio. O gesto do Lava-pés nos ensina que o maior é aquele que serve, e que o amor de Cristo se dá inteiramente como alimento."
    },
    "04-03": {
        season: "Sexta-Feira Santa",
        color: "vermelho",
        celebration: "Paixão do Senhor",
        history: "Dia de silêncio, jejum e adoração da Cruz. Contemplamos o sacrifício supremo de Jesus por nossa redenção. Não se celebra a Missa, mas a Ação Litúrgica da Paixão."
    },
    "04-04": {
        season: "Sábado Santo",
        color: "roxo",
        history: "Dia de grande silêncio junto ao sepulcro do Senhor. A Igreja aguarda em oração e jejum a ressurreição. À noite, celebramos a Vígilia Pascal, a 'Mãe de todas as vigílias'."
    },
    "04-05": {
        season: "Páscoa",
        color: "branco",
        celebration: "Solenidade da Páscoa do Senhor",
        history: "O fundamento da nossa fé: Cristo ressuscitou, venceu a morte! A alegria pascal transborda na Igreja, celebrando a vida nova que o Senhor nos conquistou."
    },
    "04-06": { season: "Oitava da Páscoa", color: "branco" },
    "04-07": {
        season: "Oitava da Páscoa",
        color: "branco",
        celebration: "S. João Batista de La Salle",
        history: "Padroeiro dos educadores cristãos. Fundou os Irmãos das Escolas Cristãs e revolucionou o ensino, dedicando-se à instrução humana e cristã das crianças pobres."
    },
    "04-08": { season: "Oitava da Páscoa", color: "branco" },
    "04-09": { season: "Oitava da Páscoa", color: "branco" },
    "04-10": { season: "Oitava da Páscoa", color: "branco" },
    "04-11": {
        season: "Oitava da Páscoa",
        color: "branco",
        celebration: "S. Estanislau",
        history: "Bispo de Cracóvia e mártir. Defensor da justiça e da moral cristã perante o poder civil, foi assassinado enquanto celebrava a missa, tornando-se padroeiro da Polônia."
    },
    "04-12": { season: "2.º Dom. Páscoa (Divina Misericórdia)", color: "branco", celebration: "Domingo da Divina Misericórdia" },
    "04-13": {
        season: "Tempo Pascal",
        color: "branco",
        celebration: "S. Martinho I",
        history: "O último Papa mártir. Defendeu a fé ortodoxa sobre as duas naturezas e vontades de Cristo (humana e divina), sendo por isso exilado e sofrendo privações até a morte."
    },
    "04-14": { season: "Tempo Pascal", color: "branco" },
    "04-21": {
        season: "Tempo Pascal",
        color: "branco",
        celebration: "S. Anselmo",
        history: "Arcebispo de Cantuária e Doutor da Igreja. Conhecido como o 'Pai da Escolástica', buscou unir fé e razão, ensinando que a fé busca o entendimento (fides quaerens intellectum)."
    },
    "04-23": {
        season: "Tempo Pascal",
        color: "vermelho",
        celebration: "S. Jorge",
        history: "Mártir da Capadócia e soldado romano. Sua figura lendária vencendo o dragão simboliza a vitória da fé sobre o mal. É um dos santos mais populares da cristandade."
    },
    "04-24": { season: "Tempo Pascal", color: "branco", celebration: "S. Fidélis de Sigmaringa" },
    "04-25": {
        season: "Tempo Pascal",
        color: "vermelho",
        celebration: "S. Marcos Evangelista",
        history: "Discípulo de São Pedro e autor do segundo Evangelho. Sua narrativa destaca a força e o poder de Jesus, o Filho de Deus, que veio para servir e dar a vida."
    },
    "04-26": { season: "4.º Dom. da Páscoa (Bom Pastor)", color: "branco", celebration: "Domingo do Bom Pastor" },
    "04-29": {
        season: "Tempo Pascal",
        color: "branco",
        celebration: "Sta. Catarina de Sena",
        history: "Doutora da Igreja e mística dominicana. Trabalhou pela paz e pelo retorno do Papa a Roma. Suas cartas e o 'Diálogo' revelam um amor ardente por Cristo e pela Igreja."
    },
    "04-30": { season: "Tempo Pascal", color: "branco", celebration: "S. Pio V" },

    // Maio
    "05-01": {
        season: "Tempo Pascal",
        color: "branco",
        celebration: "S. José Operário",
        history: "Padroeiro dos trabalhadores. No dia do trabalho, a Igreja celebra o pai adotivo de Jesus como modelo de dignidade no labor humano, lembrando que o trabalho é meio de santificação."
    },
    "05-02": {
        season: "Tempo Pascal",
        color: "branco",
        celebration: "S. Atanásio",
        history: "Bispo de Alexandria e Doutor da Igreja. O grande defensor da divindade de Cristo contra a heresia ariana no Concílio de Niceia. Sofreu muitos exílios por sua fidelidade à fé."
    },
    "05-03": {
        season: "Tempo Pascal",
        color: "vermelho",
        celebration: "Ss. Filipe e Tiago Apóstolos",
        history: "Apóstolos do Senhor. Filipe, que apresentou Natanael a Jesus, e Tiago, o 'Menor', que foi bispo de Jerusalém e autor de uma epístola que nos exorta à prática da fé."
    },
    "05-12": {
        season: "Tempo Pascal",
        color: "vermelho",
        celebration: "Ss. Nereu e Aquileu",
        history: "Mártires romanos que abandonaram a carreira militar para seguir a Cristo. Deram testemunho de fé durante as perseguições, preferindo a coroa do martírio às honras imperiais."
    },
    "05-13": {
        season: "Tempo Pascal",
        color: "branco",
        celebration: "N. Sra. de Fátima",
        history: "Recorda as aparições da Virgem aos três pastorinhos em 1917, em Portugal. Apelo à oração do terço, penitência e conversão pela paz no mundo e salvação das almas."
    },
    "05-22": {
        season: "Tempo Pascal",
        color: "branco",
        celebration: "Sta. Rita de Cássia",
        history: "Conhecida como a 'Santa das Causas Impossíveis'. Esposa, mãe, viúva e monja beneditina, suportou grandes sofrimentos com paciência e amor, recebendo o estigma de um espinho da coroa de Cristo."
    },
    "05-26": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Filipe Néri",
        history: "O 'Apóstolo de Roma' e 'Santo da Alegria'. Fundou o Oratório e dedicou-se à formação espiritual dos jovens e à caridade, sempre com um sorriso e profunda humildade."
    },
    "05-23": { season: "Tempo Pascal", color: "branco" },
    "05-24": { season: "Pentecostes (Vigília)", color: "vermelho" },
    "05-25": { season: "Pentecostes", color: "vermelho", celebration: "Solenidade de Pentecostes" },
    "05-27": { season: "Tempo Comum", color: "verde" },
    "05-28": { season: "Tempo Comum", color: "verde" },
    "05-29": { season: "Tempo Comum", color: "verde" },
    "05-30": { season: "Tempo Comum", color: "verde" },
    "05-31": {
        season: "Visitação de N. Sra.",
        color: "branco",
        celebration: "Visitação de Nossa Senhora",
        history: "Celebra o encontro de Maria, grávida de Jesus, com sua prima Isabel, grávida de João Batista. É o encontro de duas mães e dois filhos, onde o Batista estremece de alegria no ventre e Maria entoa o Magnificat."
    },

    // Junho
    "06-01": {
        season: "Santíssima Trindade",
        color: "branco",
        celebration: "Solenidade da Santíssima Trindade",
        history: "Mistério central da nossa fé: um só Deus em três Pessoas - Pai, Filho e Espírito Santo. Celebramos a fonte de todo amor e a comunhão perfeita que DEUS é em Si mesmo."
    },
    "06-03": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "S. Carlos Lwanga e companheiros",
        history: "Mártires de Uganda no século XIX. Carlos e seus jovens companheiros foram queimados vivos por se recusarem a abandonar a fé cristã e por defenderem a castidade."
    },
    "06-05": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "S. Bonifácio",
        history: "O 'Apóstolo da Alemanha'. Monge inglês que evangelizou os povos germânicos. É conhecido por ter derrubado o carvalho sagrado de Thor para mostrar a superioridade de Cristo."
    },
    "06-06": {
        season: "Corpus Christi",
        color: "branco",
        celebration: "Solenidade do Corpo e Sangue de Cristo",
        history: "Celebramos a presença real de Jesus na Eucaristia. É o dia em que o Senhor sai às ruas em procissão para abençoar a cidade e ser adorado publicamente pelos fiéis."
    },
    "06-11": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "S. Barnabé Apóstolo",
        history: "Chamado 'Filho da Consolação', foi companheiro de São Paulo em suas missões. Homem de fé e cheio de Espírito Santo, ajudou a introduzir Paulo na comunidade de Jerusalém."
    },
    "06-12": {
        season: "Sagrado Coração de Jesus",
        color: "branco",
        celebration: "Solenidade do Sagrado Coração de Jesus",
        history: "Celebramos o amor infinito de Deus revelado no coração humano de Jesus, que foi traspassado pela lança na cruz. É uma fonte inesgotável de misericórdia e perdão."
    },
    "06-13": {
        season: "Imac. Coração de Maria",
        color: "branco",
        celebration: "S. Antônio de Lisboa",
        history: "O 'Santo do Mundo Inteiro'. Grande pregador e Doutor da Igreja, mestre da Bíblia e defensor dos pobres. Conhecido pelos inúmeros milagres e por segurar o Menino Jesus em seus braços."
    },
    "06-21": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Luís Gonzaga",
        history: "Padroeiro da juventude cristã. De família nobre, renunciou a tudo para entrar na Companhia de Jesus. Morreu jovem cuidando de doentes numa epidemia de peste em Roma."
    },
    "06-24": {
        season: "Natividade de S. João Batista",
        color: "branco",
        celebration: "Natividade de S. João Batista",
        history: "João é o Precursor que veio preparar os caminhos do Senhor. É o único santo, além de Nossa Senhora, de quem celebramos o nascimento terreno, além do nascimento no céu."
    },
    "06-28": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Ireneu",
        history: "Bispo de Lyon e Doutor da Igreja. O grande teólogo da paz e da unidade que combateu as heresias primitivas, ensinando que a glória de Deus é o homem vivente."
    },
    "06-29": {
        season: "Ss. Pedro e Paulo",
        color: "vermelho",
        celebration: "Solenidade dos Ss. Pedro e Paulo",
        history: "As duas colunas da Igreja. Pedro, a Rocha sobre a qual Cristo edificou sua Igreja; Paulo, o Apóstolo das Nações que levou o Evangelho aos confins do mundo."
    },
    "06-30": { season: "Primeiros Mártires de Roma", color: "vermelho" },

    // Julho
    "07-03": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "S. Tomás Apóstolo",
        history: "O apóstolo que duvidou da ressurreição até tocar nas feridas de Jesus. Sua confissão 'Meu Senhor e meu Deus' é uma das maiores profissões de fé do Evangelho."
    },
    "07-11": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Bento Abade",
        history: "Pai do monaquismo ocidental e padroeiro da Europa. Fundou a Ordem de São Bento e escreveu a famosa Regra, baseada no equilíbrio entre oração e trabalho (Ora et Labora)."
    },
    "07-15": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Boaventura",
        history: "O 'Doutor Seráfico'. Grande teólogo franciscano e bispo, uniu a sabedoria da mente ao fervor do coração, sendo um dos maiores mestres da vida mística."
    },
    "07-16": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "N. Sra. do Carmo",
        history: "Padroeira da Ordem dos Carmelitas. Celebra a entrega do escapulário a São Simão Stock, sinal de proteção materna e compromisso de seguir a Cristo como Maria."
    },
    "07-22": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "Sta. Maria Madalena",
        history: "A 'Apóstola dos Apóstolos'. Foi a primeira a ver o Senhor ressuscitado e a anunciar a boa nova aos discípulos, após ter sido curada e perdoada por Jesus."
    },
    "07-26": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "Ss. Joaquim e Ana",
        history: "Pais da Virgem Maria e avós de Jesus. São modelos para os avós e para a vida familiar, tendo educado Maria na fé e na esperança das promessas de Deus."
    },
    "07-29": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "Ss. Marta, Maria e Lázaro",
        history: "Os amigos de Jesus em Betânia. Marta nos ensina o serviço diligente, Maria a adoração aos pés do Mestre e Lázaro é o sinal da força de Jesus sobre a morte."
    },
    "07-31": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Inácio de Loyola",
        history: "Fundador da Companhia de Jesus (Jesuítas). Soldier convertido que se tornou soldado de Cristo, escreveu os 'Exercícios Espirituais' para ajudar a buscar a vontade divina."
    },


    // Agosto
    "08-01": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Afonso Maria de Ligório",
        history: "Bispo, Doutor da Igreja e fundador da Congregação do Santíssimo Redentor (Redentoristas). Grande mestre da teologia moral e da oração, é autor de obras clássicas como 'As Glórias de Maria'."
    },
    "08-04": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. João Maria Vianney",
        history: "O 'Cura d'Ars', padroeiro dos párocos. Dedicava até 16 horas por dia à confissão, transformando a pequena paróquia de Ars em um centro de peregrinação e conversão para toda a França."
    },
    "08-06": {
        season: "Transfiguração do Senhor",
        color: "branco",
        celebration: "Transfiguração do Senhor",
        history: "Manifestação da glória de Jesus no Monte Tabor diante de Pedro, Tiago e João. Antecipação da ressurreição que fortalece os discípulos para enfrentarem o caminho da cruz."
    },
    "08-08": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Domingos",
        history: "Fundador da Ordem dos Pregadores (Dominicanos). Combateu as heresias através da pregação itinerante, da pobreza e do estudo profundo, sendo um grande propagador da oração do Rosário."
    },
    "08-10": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "S. Lourenço Mártir",
        history: "Diácono da Igreja de Roma. Ao ser ordenado a entregar os tesouros da Igreja, apresentou os pobres. Morreu assado vivo numa grelha, mantendo o bom humor e a fé até o fim."
    },
    "08-11": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "Sta. Clara",
        history: "Seguidora fiel de São Francisco e fundadora das Clarissas. Viveu em extrema pobreza e oração contemplativa, sendo uma luz de espiritualidade e força no claustro de São Damião."
    },
    "08-15": {
        season: "Assunção de N. Sra.",
        color: "branco",
        celebration: "Solenidade da Assunção de Nossa Senhora",
        history: "Celebra o dogma de que Maria, ao fim de sua vida terrena, foi elevada em corpo e alma à glória do céu. É o triunfo da Mãe de Deus e a esperança da nossa própria ressurreição."
    },
    "08-16": {
        season: "Assunção de N. Sra.",
        color: "branco",
        celebration: "S. Roque",
        history: "Padroeiro contra as pestes e protetor dos cães. Peregrino que dedicou sua vida a cuidar de doentes, sendo um exemplo de caridade heroica e confiança na divina providência."
    },
    "08-22": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "N. Sra. Rainha",
        history: "Festa que completa a Assunção: Maria, elevada ao céu, é coroada Rainha de todo o universo pelo seu Filho, tornando-se nossa advogada e medianeira de todas as graças."
    },
    "08-27": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "Sta. Mônica",
        history: "Modelo de mãe cristã. Chorou e rezou durante 30 anos pela conversão de seu filho Agostinho, ensinando que a oração perseverante e o amor materno podem mover o coração de Deus."
    },
    "08-28": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Agostinho",
        history: "Bispo de Hipona e um dos maiores Doutores da Igreja. Após uma juventude inquieta, converteu-se e tornou-se um gênio do pensamento cristão, autor de 'Confissões' e 'A Cidade de Deus'."
    },
    "08-29": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "Martírio de S. João Batista",
        history: "O Precursor selou sua missão com o sangue. Morreu por defender a verdade e a santidade do matrimônio perante o rei Herodes, sendo 'o maior entre os nascidos de mulher'."
    },


    // Setembro
    "09-03": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Gregório Magno",
        history: "Papa e Doutor da Igreja. Organizou a liturgia, promoveu o canto gregoriano e enviou missionários para evangelizar a Inglaterra. Chamava a si mesmo de 'Servo dos servos de Deus'."
    },
    "09-08": {
        season: "Natividade de N. Sra.",
        color: "branco",
        celebration: "Natividade de Nossa Senhora",
        history: "Celebramos o nascimento da Virgem Maria, a 'Aurora da Salvação'. Sua vinda ao mundo anuncia a chegada do Salvador, como a estrela da manhã anuncia o sol."
    },
    "09-13": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. João Crisóstomo",
        history: "Arcebispo de Constantinopla e Doutor da Igreja. Conhecido como 'Boca de Ouro' por sua eloquência, foi um defensor da justiça social e da fidelidade ao Evangelho."
    },
    "09-14": {
        season: "Exaltação da S. Cruz",
        color: "vermelho",
        celebration: "Exaltação da Santa Cruz",
        history: "A Cruz deixa de ser instrumento de suplício para se tornar sinal de vitória e salvação. Contemplamos o amor de Cristo que, entregando-se na árvore da cruz, redimiu o mundo."
    },
    "09-15": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "N. Sra. das Dores",
        history: "Honramos Maria que esteve aos pés da Cruz, associada intimamente ao sacrifício de seu Filho. Suas sete dores revelam a profundidade de seu amor e co-redenção."
    },
    "09-21": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "S. Mateus Evangelista",
        history: "Publicano que deixou a mesa de impostos para seguir o chamado de Jesus. Autor do primeiro Evangelho, escreveu especialmente para mostrar aos judeus que Jesus é o Messias."
    },
    "09-23": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Padre Pio de Pietrelcina",
        history: "Capuchinho estigmatizado que dedicou a vida à confissão e ao auxílio aos sofredores. Modelo de união com a Paixão de Cristo e de obediência heroica à Igreja."
    },
    "09-27": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Vicente de Paulo",
        history: "O 'Pai da Caridade'. Fundador dos Lazaristas e das Filhas da Caridade. Dedicou-se a servir a Cristo na pessoa dos pobres, dizendo que eles são nossos senhores e mestres."
    },
    "09-29": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "Ss. Arcanjos Miguel, Gabriel e Rafael",
        history: "Os príncipes da milícia celeste. Miguel, o defensor contra o mal; Gabriel, o mensageiro da encarnação; e Rafael, o guia medicinal que nos acompanha no caminho."
    },
    "09-30": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Jerônimo",
        history: "Doutor da Igreja que traduziu a Bíblia para o latim (Vulgata). Dizia que 'ignorar as Escrituras é ignorar o próprio Cristo', sendo o grande mestre do estudo bíblico."
    },

    // Outubro
    "10-01": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "Sta. Teresa do Menino Jesus",
        history: "A 'Pequena Flor' e Doutora da Igreja. Ensinou a 'Pequena Via' da infância espiritual: santificar os pequenos gestos cotidianos com um amor extraordinário."
    },
    "10-02": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "Ss. Anjos da Guarda",
        history: "Celebramos a guia e proteção dos anjos que Deus nos concede para nos amparar no caminho da vida. Uma lembrança da presença constante do cuidado divino."
    },
    "10-07": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "N. Sra. do Rosário",
        history: "Recorda a vitória da oração contemplativa. Maria nos convida a meditar os mistérios da vida de Cristo através desta oração simples e profunda."
    },
    "10-04": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. Francisco de Assis",
        history: "O 'Poverello'. Renunciou a todas as riquezas para seguir a Cristo na pobreza evangélica. Amava todas as criaturas e recebeu os estigmas da Paixão do Senhor."
    },
    "10-12": {
        season: "N. Sra. Aparecida",
        color: "branco",
        celebration: "N. Sra. Aparecida — Padroeira do Brasil",
        history: "A Rainha e Padroeira do Brasil. Sua imagem foi encontrada nas águas do Rio Paraíba em 1717, tornando-se o maior símbolo da fé e da unidade do povo brasileiro."
    },
    "10-15": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "Sta. Teresa de Ávila",
        history: "Doutora da Igreja e reformadora do Carmelo. Grande mística e escritora, ensinou que 'só Deus basta' e descreveu o caminho da alma até a união com Deus no 'Castelo Interior'."
    },
    "10-18": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "S. Lucas Evangelista",
        history: "Médico e pintor, é o autor do terceiro Evangelho e dos Atos dos Apóstolos. Destaca a misericórdia de Jesus e a alegria do Evangelho."
    },
    "10-22": {
        season: "Tempo Comum",
        color: "branco",
        celebration: "S. João Paulo II",
        history: "O 'Papa da Família' e da juventude. Peregrino do mundo, testemunhou a fé com coragem e amor, exortando a todos: 'Não tenhais medo! Abri as portas para Cristo!'"
    },

    // Novembro
    "11-01": {
        season: "Todos os Santos",
        color: "branco",
        celebration: "Solenidade de Todos os Santos",
        history: "Celebramos a multidão de eleitos que já gozam da visão de Deus no céu. É a festa da nossa vocação comum à santidade e da amizade com os santos."
    },
    "11-02": {
        season: "Fiéis Defuntos",
        color: "roxo",
        celebration: "Comemoração de Todos os Fiéis Defuntos",
        history: "Dia de oração e sufrágio por todos os que partiram. Afirmamos nossa fé na ressurreição e na comunhão dos santos que une a Igreja da terra à do purgatório."
    },
    "11-22": {
        season: "Tempo Comum",
        color: "vermelho",
        celebration: "Sta. Cecília",
        history: "Padroeira dos músicos. Mártir romana que, segundo a tradição, cantava louvores ao Senhor em seu coração durante o seu martírio, permanecendo fiel até a morte."
    },
    "11-29": {
        season: "Cristo Rei (último Dom. Comum)",
        color: "branco",
        celebration: "Solenidade de Cristo Rei do Universo",
        history: "Encerramento do Ano Litúrgico. Proclamamos que Jesus Cristo é o Senhor do tempo e da história, cujo Reino de amor, justiça e paz não terá fim."
    },
    "11-30": {
        season: "Advento",
        color: "roxo",
        celebration: "S. André Apóstolo",
        history: "O primeiro dos apóstolos a ser chamado. Irmão de Pedro, foi quem o apresentou a Jesus. Morreu mártir em uma cruz em forma de X."
    },

    // Dezembro — Advento e Natal
    "12-06": {
        season: "Advento",
        color: "roxo",
        celebration: "S. Nicolau",
        history: "Bispo de Mira, conhecido por sua generosidade e amor às crianças e aos pobres. É a inspiração histórica para a figura do Papai Noel."
    },
    "12-14": {
        season: "Advento (3º Dom. — Gaudete)",
        color: "rosa",
        celebration: "S. João da Cruz",
        history: "Doutor Místico e reformador do Carmelo. Seus escritos sobre a 'Noite Escura' e o 'Cântico Espiritual' são cumes da literatura e espiritualidade cristã."
    },
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
    const [showHistory, setShowHistory] = useState(false);
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
        setShowHistory(false);
    };

    const goPrev = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
        setShowHistory(false);
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
                        setShowHistory(false);
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

                    {dayData.history && (
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            style={{
                                marginTop: "12px",
                                background: `${meta.hex}12`,
                                border: `1px solid ${meta.hex}33`,
                                borderRadius: "20px",
                                padding: "6px 14px",
                                color: meta.hex,
                                fontSize: "0.8rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.2s",
                            }}
                        >
                            {showHistory ? "🔼 Fechar história" : "📖 Conhecer a história"}
                        </button>
                    )}

                    {!dayData.celebration && (
                        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#666", fontStyle: "italic", opacity: 0.8 }}>
                            Neste dia, celebra-se a missa do tempo litúrgico vigente.
                        </p>
                    )}
                </div>
            </div>

            {/* História do Santo (Expandida) */}
            {dayData.history && showHistory && (
                <div style={{
                    background: "white",
                    border: `1px solid ${meta.hex}22`,
                    borderTop: `4px solid ${meta.hex}`,
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: `0 8px 25px ${meta.hex}15`,
                    position: "relative",
                    marginTop: "4px"
                }}>
                    <div style={{
                        position: "absolute",
                        top: -12,
                        left: 20,
                        background: meta.hex,
                        color: "white",
                        padding: "2px 10px",
                        borderRadius: "10px",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        textTransform: "uppercase"
                    }}>
                        Vida do Santo
                    </div>
                    <p style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        lineHeight: "1.7",
                        color: "#2d3436",
                        textAlign: "justify",
                        whiteSpace: "pre-wrap"
                    }}>
                        {dayData.history}
                    </p>
                </div>
            )}


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

