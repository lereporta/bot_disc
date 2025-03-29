// index.js
const { Client, GatewayIntentBits, PermissionsBitField } = require(
    "discord.js",
);
require("dotenv").config(); // Linha adicionada

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const PREFIX = "!";

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

    // Comando !criarprojeto
    if (command === "criarprojeto") {
        message.channel.send("Qual o nome do projeto?");

        const filter = (m) => m.author.id === message.author.id;
        const projectNameCollector = await message.channel.awaitMessages({
            filter,
            max: 1,
            time: 60000,
        });
        if (!projectNameCollector.size) {
            return message.channel.send("Tempo esgotado. Tente novamente.");
        }
        const projectName = projectNameCollector.first().content;

        message.channel.send("Mencione os usuários para o projeto:");
        const usersCollector = await message.channel.awaitMessages({
            filter,
            max: 1,
            time: 60000,
        });
        if (!usersCollector.size) {
            return message.channel.send("Tempo esgotado. Tente novamente.");
        }
        const mentionedUsers = usersCollector.first().mentions.members;

        if (!mentionedUsers.size) {
            return message.channel.send("Nenhum usuário mencionado.");
        }

        const adminRole = message.guild.roles.cache.find((r) =>
            r.permissions.has(PermissionsBitField.Flags.Administrator)
        );

        try {
            const projectCategory = await message.guild.channels.create({
                name: projectName,
                type: 4,
                permissionOverwrites: [
                    {
                        id: message.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    ...mentionedUsers.map((user) => ({
                        id: user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.Connect,
                        ],
                    })),
                    ...(adminRole
                        ? [{
                            id: adminRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        }]
                        : []),
                ],
            });

            await message.guild.channels.create({
                name: `${projectName}-texto`,
                type: 0,
                parent: projectCategory.id,
                permissionOverwrites: projectCategory.permissionOverwrites.cache
                    .map((p) => p),
            });

            await message.guild.channels.create({
                name: `${projectName}-voz`,
                type: 2,
                parent: projectCategory.id,
                permissionOverwrites: projectCategory.permissionOverwrites.cache
                    .map((p) => p),
            });

            message.channel.send(`Projeto **${projectName}** criado!`);
        } catch (err) {
            console.error(err);
            message.channel.send("Erro ao criar projeto.");
        }
    }

    // Comando !removercanal
    if (command === "removercanal") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator,
            )
        ) {
            return message.channel.send("Você precisa ser administrador!");
        }

        const channelName = args.join(" ");
        if (!channelName) {
            return message.channel.send("Digite o nome do canal.");
        }

        const channel = message.guild.channels.cache.find((c) =>
            c.name === channelName
        );
        if (!channel) return message.channel.send("Canal não encontrado.");

        try {
            await channel.delete();
            message.channel.send(`Canal **${channelName}** removido.`);
        } catch (err) {
            console.error(err);
            message.channel.send("Erro ao remover canal.");
        }
    }
});

// Última linha do arquivo:
client.login(process.env.DISCORD_TOKEN);

