const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require(
    "discord.js",
);
require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const PREFIX = "!";
const CANAL_LIMPEZA = "🆕cria-projetos-novos"; // Nome do canal onde as mensagens devem ser apagadas

client.on("ready", () => {
    console.log(`Bot está online como ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Comando !ping
    if (command === "ping") {
        const pingMessage = await message.channel.send("Pong!");
        pingMessage.edit(
            `Pong! Latência é ${
                pingMessage.createdTimestamp - message.createdTimestamp
            }ms`,
        );
        return;
    }

    if (command === "criarprojeto") {
        message.channel.send("Qual o nome do projeto a ser criado?");
        const filter = (m) => m.author.id === message.author.id;
        const respostaForum = await message.channel.awaitMessages({
            filter,
            max: 1,
            time: 60000,
        });

        if (!respostaForum.size) {
            return message.channel.send("Tempo esgotado. Tente novamente.");
        }

        const nomeForum = respostaForum.first().content;
        const categoria = message.guild.channels.cache.find((c) =>
            c.name === "PROJETOS" && c.type === ChannelType.GuildCategory
        );

        if (!categoria) {
            return message.channel.send(
                "Categoria 'PROJETOS' não encontrada. Certifique-se de que ela existe.",
            );
        }

        let forumChannel;
        try {
            forumChannel = await message.guild.channels.create({
                name: nomeForum,
                type: ChannelType.GuildForum,
                parent: categoria.id,
                availableTags: [
                    { name: "🎨Design" },
                    { name: "💻Front-End" },
                    { name: "🖥Back-End" },
                    { name: "🐳DevOps" },
                ],
                defaultReactionEmoji: null,
                defaultThreadRateLimitPerUser: 0,
                defaultSortOrder: null,
                defaultForumLayout: 0,
                flags: 0,
                topic: "",
                requireTag: true, // <- Isso força a seleção de tag (pelo menos é pra ser)
            });
        } catch (err) {
            console.error(err);
            return message.channel.send("Erro ao criar o fórum.");
        }

        // Criar postagens dentro do fórum com as tags corretas
        const postagens = [
            {
                name: "Design",
                tagName: "🎨Design",
                message: "Discussão sobre Design!",
            },
            {
                name: "Front-End",
                tagName: "💻Front-End",
                message: "Discussão sobre Front-End!",
            },
            {
                name: "Back-End",
                tagName: "🖥Back-End",
                message: "Discussão sobre Back-End!",
            },
            {
                name: "DevOps",
                tagName: "🐳DevOps",
                message: "Discussão sobre DevOps!",
            },
        ];

        function normalizarEmoji(str) {
            return str
                .replace(/\uFE0F/g, "")
                .replace(/\u200B/g, "")
                .trim();
        }

        for (const postagem of postagens) {
            const tag = forumChannel.availableTags.find((t) =>
                t.name.trim().toLowerCase() ===
                    postagem.tagName.trim().toLowerCase()
            );

            if (!tag) {
                console.warn(
                    ` Tag não encontrada para "${postagem.name}". Verifique se o nome e o emoji da tag correspondem ao que está no Discord.`,
                );
                continue;
            }

            try {
                const threadMessage = await forumChannel.threads.create({
                    name: postagem.name,
                    autoArchiveDuration: 1440,
                    appliedTags: [tag.id],
                    message: { content: postagem.message },
                    reason:
                        "Criação automática de postagem para organização do projeto",
                });

                console.log(` Postagem criada: ${postagem.name}`);
            } catch (err) {
                console.error(
                    ` Erro ao criar a postagem "${postagem.name}":`,
                    err,
                );
            }
        }

        message.channel.send(
            `Fórum **${nomeForum}** criado com as postagens: ${
                postagens.map((p) => p.name).join(", ")
            }.`,
        );
    }

    // Comando !removercanal atualizado para remover fóruns também
    if (command === "removercanal") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator,
            )
        ) {
            return message.channel.send("Você precisa ser administrador mané!");
        }

        const channelName = args.join(" ");
        if (!channelName) {
            return message.channel.send(
                "Digite o nome do canal ou projeto que deseja remover.",
            );
        }

        const channel = message.guild.channels.cache.find((c) =>
            c.name === channelName
        );
        if (!channel) {
            return message.channel.send("Canal ou fórum não encontrado.");
        }

        try {
            await channel.delete();
            message.channel.send(`Canal ou fórum **${channelName}** removido.`);
        } catch (err) {
            console.error(err);
            message.channel.send("Erro ao remover canal ou fórum.");
        }
    }
});

//  limpa mensagens no canal cria-projetos-novos após 1 minuto
client.on("messageCreate", async (message) => {
    if (message.channel.name === CANAL_LIMPEZA) {
        setTimeout(async () => {
            try {
                if (!message.pinned) {
                    await message.delete();
                }
            } catch (err) {
                console.warn(`Erro ao deletar mensagem: ${err.message}`);
            }
        }, 60000); // 1 minuto
    }
});

// Última linha do arquivo:
client.login(process.env.DISCORD_TOKEN);
