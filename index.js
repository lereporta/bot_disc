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
const CANAL_LIMPEZA = "🆕cria-projetos-novos";

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
        return pingMessage.edit(
            `Pong! Latência é ${
                pingMessage.createdTimestamp - message.createdTimestamp
            }ms`,
        );
    }

    // Comando !criarprojeto
    if (command === "criarprojeto") {
        await message.channel.send("Qual o nome do projeto a ser criado?");
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
        const categoria = message.guild.channels.cache.find(
            (c) =>
                c.name === "PROJETOS" && c.type === ChannelType.GuildCategory,
        );
        if (!categoria) {
            return message.channel.send("Categoria 'PROJETOS' não encontrada.");
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
                requireTag: true,
            });
        } catch (err) {
            console.error(err);
            return message.channel.send("Erro ao criar o fórum.");
        }

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

        for (const postagem of postagens) {
            const tag = forumChannel.availableTags.find(
                (t) =>
                    t.name.trim().toLowerCase() ===
                        postagem.tagName.trim().toLowerCase(),
            );
            if (!tag) {
                console.warn(`Tag não encontrada para "${postagem.name}".`);
                continue;
            }
            try {
                await forumChannel.threads.create({
                    name: postagem.name,
                    autoArchiveDuration: 1440,
                    appliedTags: [tag.id],
                    message: { content: postagem.message },
                });
                console.log(`Postagem criada: ${postagem.name}`);
            } catch (err) {
                console.error(
                    `Erro ao criar postagem "${postagem.name}":`,
                    err,
                );
            }
        }

        return message.channel.send(
            `Fórum **${nomeForum}** criado com: ${
                postagens.map((p) => p.name).join(", ")
            }.`,
        );
    }

    // Comando !removercanal com confirmação e logs
    if (command === "removercanal") {
        console.log(`Comando removercanal iniciado por ${message.author.tag}`);
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator,
            )
        ) {
            console.log("Usuário sem permissão de administrador");
            return message.channel.send("Você precisa ser administrador!");
        }
        if (
            !message.guild.members.me.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            console.log("Bot sem permissão ManageChannels");
            return message.channel.send(
                "❌ Preciso de **Gerenciar Canais** para excluir canais ou fóruns.",
            );
        }

        // slug normalize
        const normalize = (str) =>
            str.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[-_\s]+/g, "");

        // obtém nome ou prompt
        let input = args.join(" ");
        console.log(`Input inicial: '${input}'`);
        if (!input) {
            console.log("Coletando nome interativamente");
            await message.channel.send("Qual canal/projeto deseja remover?");
            const cName = await message.channel.awaitMessages({
                filter: (m) => m.author.id === message.author.id,
                max: 1,
                time: 60000,
            });
            if (!cName.size) {
                console.log("Nenhuma resposta de nome");
                return message.channel.send("Tempo esgotado. Cancelado.");
            }
            input = cName.first().content.trim();
            console.log(`Nome coletado: '${input}'`);
        }

        // busca canal
        let channel = message.mentions.channels.first();
        if (channel) console.log(`Menção: ${channel.name}`);
        if (!channel) {
            channel = message.guild.channels.cache.find(
                (c) =>
                    [ChannelType.GuildForum, ChannelType.GuildText].includes(
                        c.type,
                    ) &&
                    normalize(c.name) === normalize(input),
            );
            console.log(
                channel
                    ? `Achou no cache: ${channel.name}`
                    : "Não achou no cache",
            );
        }
        if (!channel) {
            console.log(
                `Canais disponíveis: ${
                    message.guild.channels.cache.map((c) => c.name).join(", ")
                }`,
            );
            return message.channel.send("❌ Canal ou fórum não encontrado.");
        }

        // confirmação
        console.log(`Perguntando confirmação para ${message.author.tag}`);
        await message.channel.send(
            `Tem certeza que deseja remover **${channel.name}**? (sim/não)`,
        );
        const conf = await message.channel.awaitMessages({
            filter: (m) =>
                m.author.id === message.author.id &&
                ["sim", "não", "nao"].includes(m.content.toLowerCase()),
            max: 1,
            time: 30000,
        });
        if (!conf.size) {
            console.log("Sem confirmação");
            return message.channel.send("Tempo esgotado. Cancelado.");
        }
        const ans = conf.first().content.toLowerCase();
        console.log(`Resposta de confirmação: '${ans}'`);
        if (ans !== "sim") {
            console.log("Cancelado pelo usuário");
            return message.channel.send("Operação cancelada.");
        }

        // delete
        try {
            console.log(`Deletando canal ${channel.name}`);
            await channel.delete();
            console.log(`Deletado: ${channel.name}`);
            return message.channel.send(
                `✅ **${channel.name}** removido com sucesso!`,
            );
        } catch (err) {
            console.error("Erro deletar canal:", err);
            return message.channel.send("❌ Erro ao remover canal.");
        }
    }
});

// limpeza automática
client.on("messageCreate", async (message) => {
    if (message.channel.name === CANAL_LIMPEZA) {
        setTimeout(async () => {
            try {
                if (!message.pinned) await message.delete();
            } catch (err) {
                console.warn(`Erro ao apagar mensagem: ${err.message}`);
            }
        }, 60000);
    }
});

client.login(process.env.DISCORD_TOKEN);
