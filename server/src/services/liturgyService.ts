import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LiturgySection {
    title: string;
    content: string;
}

export interface LiturgyData {
    date: string;
    sections: LiturgySection[];
}

const cache = new Map<string, { data: LiturgyData, timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Manual overrides for dates where the scraper might fail or site is incomplete
const SPECIAL_LITURGIES: Record<string, LiturgyData> = {
    '2026-04-04': {
        date: '2026-04-04',
        sections: [
            {
                title: '1ª Leitura (Gn 1,1.26-31a)',
                content: 'No princípio Deus criou o céu e a terra. Deus disse: \'Façamos o homem à nossa imagem e semelhança. Que ele domine sobre os peixes do mar, sobre as aves do céu, sobre os animais domésticos, sobre todas as feras e sobre todos os répteis que rastejam sobre a terra\'. E Deus criou o homem à sua imagem, à imagem de Deus ele o criou: homem e mulher os criou. E Deus os abençoou e lhes disse: \'Sede fecundos e multiplicai-vos, enchei a terra e submetei-a\'. E Deus viu tudo quanto havia feito, e eis que tudo era muito bom.'
            },
            {
                title: 'Salmo Sl 103(104)',
                content: 'Refrão: Enviai o vosso Espírito, Senhor, e da terra toda a face renovai.\n\nBendize, ó minha alma, ao Senhor! Ó meu Deus e meu Senhor, como sois grande! De majestade e esplendor vos revestis e de luz vos envolveis como num manto.'
            },
            {
                title: '2ª Leitura (Gn 22,1-2.9a.10-13.15-18)',
                content: 'Naqueles dias, Deus pôs Abraão à prova. Chamando-o, disse: \'Abraão!\' E ele respondeu: \'Aqui estou\'. E Deus disse: \'Toma teu filho único, Isaac, a quem tanto amas, dirige-te à terra de Moriá, e oferece-o aí em holocausto sobre uma montanha que eu te indicar\'. Chegados ao lugar indicado por Deus, Abraão ergueu um altar. Estendeu a mão e pegou o cutelo para imolar o seu filho. Mas o anjo do Senhor chamou-o do céu, dizendo: \'Abraão! Abraão! Não estendas a mão contra o menino! Agora sei que temes a Deus, pois não me recusaste teu filho único\'.'
            },
            {
                title: 'Salmo Sl 15(16)',
                content: 'Refrão: Guardai-me, ó Deus, porque em vós me refugio!\n\nÓ Senhor, sois minha herança e minha taça, meu destino está seguro em vossas mãos! Tenho sempre o Senhor ante meus olhos, pois se o tenho a meu lado não vacilo.'
            },
            {
                title: '3ª Leitura (Ex 14,15-15,1)',
                content: 'Naqueles dias, o Senhor disse a Moisés: \'Por que clamas a mim por socorro? Dize aos filhos de Israel que se ponham em marcha. Quanto a ti, ergue a tua vara, estende a mão sobre o mar e divide-o, para que os filhos de Israel caminhem a pé enxuto pelo meio do mar\'. Os israelitas entraram pelo meio do mar a pé enxuto, enquanto as águas formavam como que uma muralha à direita e à esquerda. Os egípcios puseram-se a persegui-los, mas o Senhor precipitou os egípcios no meio do mar.'
            },
            {
                title: 'Salmo (Ex 15)',
                content: 'Refrão: Cantemos ao Senhor que fez brilhar a sua glória!\n\nAo Senhor quero cantar, pois fez brilhar a sua glória: precipitou no mar Vermelho o cavalo e o cavaleiro! O Senhor é minha força, é a razão do meu cantar, pois foi ele neste dia para mim libertação!'
            },
            {
                title: '4ª Leitura (Is 54,5-14)',
                content: 'O teu criador é o teu esposo; o Senhor dos exércitos é o seu nome. O teu redentor é o Santo de Israel, chamado Deus de toda a terra. Por um breve instante eu te abandonei, mas com imensa compaixão eu te acolho. Num momento de indignação, por um pouco ocultei de ti minha face, mas com misericórdia eterna eu me compadeci de ti, diz teu Salvador, o Senhor.'
            },
            {
                title: 'Salmo Sl 29(30)',
                content: 'Refrão: Eu vos exalto, ó Senhor, pois me livrastes, e não deixastes rir de mim meus inimigos!\n\nSenhor, tirastes minha alma dos abismos e me salvastes, quando eu já descia para a mansão dos mortos!'
            },
            {
                title: '5ª Leitura (Is 55,1-11)',
                content: 'Assim diz o Senhor: \'Todos vós que estais com sede, vinde às águas; vós que não tendes dinheiro, apressai-vos, vinde e comei. Buscai o Senhor, enquanto pode ser achado; invocai-o, enquanto ele está perto. Abandonem os ímpios seus caminhos, e os homens maus, seus pensamentos; voltem para o Senhor, que terá piedade deles, voltem para nosso Deus, que é generoso no perdão\'.'
            },
            {
                title: 'Salmo (Is 12)',
                content: 'Refrão: Com alegria bebereis do manancial da salvação!\n\nEis o Deus, meu Salvador, eu confio e nada temo; o Senhor é minha força, meu louvor e salvação. Com alegria bebereis do manancial da salvação.'
            },
            {
                title: '6ª Leitura (Br 3,9-15.32-4,4)',
                content: 'Ouve, Israel, os preceitos da vida; presta atenção, para aprenderes a sabedoria. Que se passa, Israel? Como é que te encontras em terra inimiga? Aprende onde está a sabedoria, onde está a fortaleza e onde está a inteligência. Aquele que sabe tudo, conhece-a; descobriu-a com sua inteligência. Feliz és tu, Israel, porque te é dado conhecer o que agrada a Deus.'
            },
            {
                title: 'Salmo Sl 18B(19)',
                content: 'Refrão: Senhor, tens palavras de vida eterna.\n\nA lei do Senhor Deus é perfeita, conforto para a alma! O testemunho do Senhor é fiel, sabedoria dos humildes.'
            },
            {
                title: '7ª Leitura (Ez 36,16-28)',
                content: 'A palavra do Senhor foi-me dirigida nestes termos: \'Derramarei sobre vós uma água pura, e sereis purificados. Eu vos purificarei de todas as vossas impurezas e de todos os vossos ídolos. Dar-vos-ei um coração novo e porei um espírito novo dentro de vós. Arrancarei do vosso corpo o coração de pedra e vos darei um coração de carne\'.'
            },
            {
                title: 'Salmo Sl 41(42)',
                content: 'Refrão: A minh\'alma tem sede de Deus, e deseja o Deus vivo.\n\nAssim como a corça suspira pelas águas correntes, suspira igualmente minh\'alma por vós, ó meu Deus!'
            },
            {
                title: '8ª Leitura - Epístola (Rm 6,3-11)',
                content: 'Irmãos: Será que ignorais que todos nós, batizados em Jesus Cristo, é na sua morte que fomos batizados? Pelo batismo na sua morte, fomos sepultados com ele, para que, como Cristo ressuscitou dos mortos pela glória do Pai, assim também nós levemos uma vida nova. Sabemos que Cristo, ressuscitado dos mortos, não morre mais; a morte já não tem poder sobre ele.'
            },
            {
                title: 'Salmo Sl 117(118)',
                content: 'Refrão: Aleluia, Aleluia, Aleluia!\n\nDai graças ao Senhor, porque ele é bom! \'Eterna é a sua misericórdia!\' A casa de Israel agora o diga: \'Eterna é a sua misericórdia!\''
            },
            {
                title: 'Evangelho (Mt 28,1-10)',
                content: 'Depois do sábado, ao amanhecer do primeiro dia da semana, Maria Madalena e a outra Maria foram ver o sepulcro. De repente, houve um grande tremor de terra: o anjo do Senhor desceu do céu, retirou a pedra e sentou-se nela. O anjo disse às mulheres: \'Não tenhais medo! Sei que procurais Jesus, que foi crucificado. Ele não está aqui! Ressuscitou, como havia dito! Vinde ver o lugar onde ele estava. Ide depressa dizer aos discípulos que ele ressuscitou dos mortos\'.'
            }
        ]
    }
};

export const getLiturgy = async (dateStr: string): Promise<LiturgyData> => {
    // Check special overrides
    if (SPECIAL_LITURGIES[dateStr]) {
        console.log(`[LiturgyService] Returning special override for ${dateStr}`);
        return SPECIAL_LITURGIES[dateStr];
    }

    // Check cache
    const cached = cache.get(dateStr);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log(`[LiturgyService] Returning cached data for ${dateStr}`);
        return cached.data;
    }

    console.log(`[LiturgyService] Scraping data for ${dateStr}`);
    const [year, month, day] = dateStr.split('-');

    // URL format: https://liturgia.cancaonova.com/pb/?sDia=22&sMes=2&sAno=2026
    // Note: Canção Nova month is 1-indexed (Jan=1, Feb=2...) but let's double check if we need to adjust.
    // Based on previous research: sMes=03 is March. So it's 1-indexed.
    const url = `https://liturgia.cancaonova.com/pb/?sDia=${parseInt(day)}&sMes=${parseInt(month)}&sAno=${year}`;

    try {
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(html);
        const sections: LiturgySection[] = [];

        // Dynamic extraction based on the tab navigation or available content divs
        // Canção Nova uses a tab system: .nav-tabs li a contains the titles, 
        // and their href points to IDs like #liturgia-1, #liturgia-2, etc.
        const tabs = $('.nav-tabs li a');

        if (tabs.length > 0) {
            tabs.each((_, el) => {
                const title = $(el).text().replace(/\s+/g, ' ').trim();
                const contentId = $(el).attr('href');
                if (contentId && contentId.startsWith('#')) {
                    const container = $(contentId);
                    let content = '';

                    container.find('p, h2, h3, .com-titulo, .com-subtitulo').each((_, contentEl) => {
                        const part = $(contentEl).text().trim();
                        if (part) content += part + '\n\n';
                    });

                    if (!content) {
                        content = container.text().trim();
                    }

                    if (content) {
                        sections.push({ title, content: content.trim() });
                    }
                }
            });
        } else {
            // Fallback for pages without tabs (unlikely but safe)
            $('div[id^="liturgia-"]').each((_, el) => {
                const id = $(el).attr('id');
                const contentId = `#${id}`;
                const container = $(el);

                let title = id?.replace('liturgia-', 'Leitura ') || 'Leitura';
                let content = '';

                container.find('p, h2, h3, .com-titulo, .com-subtitulo').each((_, contentEl) => {
                    const part = $(contentEl).text().trim();
                    if (part) content += part + '\n\n';
                });

                if (content) {
                    sections.push({ title, content: content.trim() });
                }
            });
        }

        const liturgyData: LiturgyData = {
            date: dateStr,
            sections
        };

        // Basic validation
        if (sections.length === 0) {
            throw new Error('Failed to extract liturgy content. Site structure might have changed.');
        }

        // Save to cache
        cache.set(dateStr, { data: liturgyData, timestamp: Date.now() });

        return liturgyData;
    } catch (error) {
        console.error(`[LiturgyService] Error scraping liturgy for ${dateStr}:`, error);
        throw error;
    }
};
