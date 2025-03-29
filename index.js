const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const PREFIX = '!'; // Prefixo para os comandos do bot

client.on('ready', () => {
    console.log(`Bot está online como ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Comando !ping - Retorna a latência do bot
    if (command === 'ping') {
        const pingMessage = await message.channel.send('Pong!');
        pingMessage.edit(`Pong! Latência é ${pingMessage.createdTimestamp - message.createdTimestamp}ms`);
        return;
    }

    // Comando !criarprojeto - Cria um novo projeto com canais de texto e voz
    if (command === 'criarprojeto') {
        // Pedir o nome do projeto
        message.channel.send('Qual o nome do projeto?');

        // Coletar o nome do projeto
        const filter = (m) => m.author.id === message.author.id;
        const projectNameCollector = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
        if (!projectNameCollector.size) return message.channel.send('Tempo esgotado. Tente novamente.');
        const projectName = projectNameCollector.first().content;

        // Pedir os usuários para o projeto
        message.channel.send('Mencione os usuários que farão parte do projeto (ex: @usuario1 @usuario2):');

        // Coletar os usuários mencionados
        const usersCollector = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
        if (!usersCollector.size) return message.channel.send('Tempo esgotado. Tente novamente.');
        const mentionedUsers = usersCollector.first().mentions.members;

        if (!mentionedUsers.size) return message.channel.send('Nenhum usuário mencionado. Operação cancelada.');

        // Verificar cargo de administrador
        const adminRole = message.guild.roles.cache.find(r => r.permissions.has(PermissionsBitField.Flags.Administrator));

        try {
            // Criar a categoria de canais com o nome do projeto
            const projectCategory = await message.guild.channels.create({
                name: projectName,
                type: 4, // Categoria
                permissionOverwrites: [
                    {
                        id: message.guild.id, // Todos
                        deny: [PermissionsBitField.Flags.ViewChannel], // Bloquear visualização
                    },
                    ...mentionedUsers.map(user => ({
                        id: user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.Connect,
                        ],
                    })),
                    ...(adminRole ? [{
                        id: adminRole.id, // Administradores
                        allow: [PermissionsBitField.Flags.ViewChannel],
                    }] : [])
                ],
            });

            // Criar canal de texto dentro da categoria
            const textChannel = await message.guild.channels.create({
                name: `${projectName}-texto`,
                type: 0, // Canal de texto
                parent: projectCategory.id,
                permissionOverwrites: projectCategory.permissionOverwrites.cache.map(p => p),
            });

            // Criar canal de voz dentro da categoria
            const voiceChannel = await message.guild.channels.create({
                name: `${projectName}-voz`,
                type: 2, // Canal de voz
                parent: projectCategory.id,
                permissionOverwrites: projectCategory.permissionOverwrites.cache.map(p => p),
            });

            // Enviar mensagem de confirmação
            message.channel.send(`Projeto **${projectName}** criado com sucesso!`);
        } catch (err) {
            console.error(err);
            message.channel.send('Ocorreu um erro ao criar o projeto. Verifique se o bot tem permissões suficientes.');
        }
    }

    // Comando !removercanal - Remove um canal especificado
    if (command === 'removercanal') {
        // Verificar se o usuário tem permissões de administrador
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.channel.send('Você precisa ser um administrador para usar esse comando!');
        }

        // Verificar se foi fornecido o nome do canal a ser removido
        const channelName = args.join(' ');
        if (!channelName) return message.channel.send('Por favor, forneça o nome do canal a ser removido.');

        // Tentar encontrar o canal pelo nome
        const channel = message.guild.channels.cache.find(c => c.name === channelName);
        if (!channel) return message.channel.send('Não encontrei um canal com esse nome.');

        // Remover o canal
        try {
            await channel.delete();
            message.channel.send(`Canal **${channelName}** foi removido com sucesso.`);
        } catch (err) {
            console.error(err);
            message.channel.send('Ocorreu um erro ao tentar remover o canal.');
        }
    }
});


client.login('REMOVED'); 




