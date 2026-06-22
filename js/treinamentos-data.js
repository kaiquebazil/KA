/* ============================================================
   KB Tech - dados compartilhados de treinamentos
   Funciona com localStorage e tenta Firestore quando disponível.
   ============================================================ */

(function() {
    var TRAININGS_KEY = 'kaos_trainings';
    var PROGRESS_KEY = 'kaos_training_progress';

    var categories = [
        'Comece por aqui',
        'Atendimento',
        'KOS / Sistema',
        'Produtos e Estoque',
        'Fornecedores',
        'Entregas',
        'Manutenção de Celulares',
        'Manutenção de Computadores',
        'Infraestrutura',
        'Marketing e Divulgação',
        'Financeiro',
        'Documentos e Garantias',
        'Padrão KB Tech'
    ];

    var audiences = [
        'Todos',
        'Atendimento',
        'Técnicos',
        'Entregadores',
        'Fornecedores',
        'Marketing',
        'Administração',
        'Parceiros'
    ];

    var moduleBlueprints = [
        {
            number: 1,
            title: 'Comece por aqui',
            category: 'Comece por aqui',
            audience: 'Todos',
            required: true,
            lessons: [
                'O que é a KB Tech',
                'Como a KB Tech ganha dinheiro',
                'Como funciona o fluxo completo',
                'Regras principais para não quebrar o projeto',
                'O que nunca fazer com cliente'
            ]
        },
        {
            number: 2,
            title: 'Atendimento ao cliente',
            category: 'Atendimento',
            audience: 'Atendimento',
            required: true,
            lessons: [
                'Como responder um cliente no WhatsApp',
                'Como entender o problema do cliente',
                'Como pedir fotos, modelo e informações',
                'Como passar orçamento sem parecer amador',
                'Como lidar com cliente difícil',
                'Como finalizar venda ou serviço'
            ]
        },
        {
            number: 3,
            title: 'Uso do KOS',
            category: 'KOS / Sistema',
            audience: 'Administração',
            required: true,
            lessons: [
                'Como acessar o KOS',
                'Como cadastrar cliente',
                'Como criar pedido',
                'Como criar OS',
                'Como atualizar status',
                'Como gerar comprovante',
                'Como consultar histórico',
                'Como fazer backup'
            ]
        },
        {
            number: 4,
            title: 'Produtos, estoque e loja',
            category: 'Produtos e Estoque',
            audience: 'Administração',
            required: true,
            lessons: [
                'Como cadastrar produto',
                'Como definir preço de venda',
                'Como marcar produto como ativo ou inativo',
                'Como controlar estoque próprio',
                'Como trabalhar com fornecedor local',
                'Como o produto aparece no site',
                'Como evitar estoque errado'
            ]
        },
        {
            number: 5,
            title: 'Fornecedores locais',
            category: 'Fornecedores',
            audience: 'Fornecedores',
            required: false,
            lessons: [
                'Como cadastrar fornecedor',
                'Como vincular produto ao fornecedor',
                'Como pedir produto pelo WhatsApp',
                'Como registrar compra com fornecedor',
                'Como comparar preço e prazo',
                'Como manter relacionamento com fornecedor'
            ]
        },
        {
            number: 6,
            title: 'Entregas',
            category: 'Entregas',
            audience: 'Entregadores',
            required: true,
            lessons: [
                'Como criar entrega',
                'Como atualizar status da entrega',
                'Como falar com cliente na entrega',
                'Como confirmar endereço',
                'Como registrar entrega finalizada',
                'Como lançar taxa de entrega no financeiro'
            ]
        },
        {
            number: 7,
            title: 'Manutenção de celulares',
            category: 'Manutenção de Celulares',
            audience: 'Técnicos',
            required: true,
            lessons: [
                'Como receber celular para análise',
                'Como registrar defeito informado',
                'Como preencher OS',
                'Como explicar troca de tela, bateria e conector',
                'Como lidar com reparo avançado mediante análise',
                'Como registrar garantia'
            ]
        },
        {
            number: 8,
            title: 'Manutenção de computadores',
            category: 'Manutenção de Computadores',
            audience: 'Técnicos',
            required: true,
            lessons: [
                'Como receber computador',
                'Como registrar senha, acessórios e defeito',
                'Como explicar formatação',
                'Como explicar backup',
                'Como explicar limpeza interna',
                'Como explicar upgrade SSD/RAM',
                'Como entregar computador formatado'
            ]
        },
        {
            number: 9,
            title: 'Infraestrutura',
            category: 'Infraestrutura',
            audience: 'Técnicos',
            required: false,
            lessons: [
                'Como receber pedido de rede',
                'Como receber pedido de câmera',
                'Como receber pedido de interfone',
                'Como fazer orçamento sob análise',
                'Como registrar visita técnica',
                'Como evitar prometer serviço sem avaliação'
            ]
        },
        {
            number: 10,
            title: 'Marketing e divulgação',
            category: 'Marketing e Divulgação',
            audience: 'Marketing',
            required: false,
            lessons: [
                'Como gravar vídeo curto',
                'Como postar serviço realizado',
                'Como divulgar sem parecer amador',
                'Como responder comentários',
                'Como usar cartão de visita',
                'Como indicar cliente para WhatsApp',
                'Como pedir avaliação real'
            ]
        },
        {
            number: 11,
            title: 'Financeiro',
            category: 'Financeiro',
            audience: 'Administração',
            required: true,
            lessons: [
                'Como registrar receita',
                'Como registrar despesa',
                'Como lançar compra de fornecedor',
                'Como lançar domínio, ferramentas e assinaturas',
                'Como calcular lucro',
                'Como evitar misturar dinheiro pessoal com dinheiro da empresa'
            ]
        },
        {
            number: 12,
            title: 'Documentos, garantia e comprovantes',
            category: 'Documentos e Garantias',
            audience: 'Administração',
            required: true,
            lessons: [
                'Como gerar comprovante',
                'Como gerar garantia',
                'Como registrar nota oficial solicitada',
                'Como explicar garantia ao cliente',
                'Como reimprimir documento antigo'
            ]
        }
    ];

    var operationChecklist = [
        'Cliente registrado',
        'Pedido registrado',
        'OS criada se houver serviço',
        'Produto vinculado',
        'Fornecedor confirmado se necessário',
        'Pagamento registrado',
        'Entrega registrada',
        'Garantia registrada',
        'Comprovante gerado',
        'Financeiro atualizado',
        'Status atualizado',
        'Backup feito regularmente'
    ];

    function safeParse(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        } catch (err) {
            return fallback;
        }
    }

    function saveLocalTrainings(list) {
        localStorage.setItem(TRAININGS_KEY, JSON.stringify((list || []).map(normalizeTraining)));
    }

    function normalizeTraining(item, index) {
        var data = Object.assign({}, item || {});
        var now = new Date().toISOString();
        data.id = String(data.id || ('treinamento-' + Date.now() + '-' + Math.random().toString(16).slice(2)));
        data.titulo = data.titulo || 'Aula sem título';
        data.descricao = data.descricao || 'Aula de treinamento interno da Universidade KB Tech.';
        data.modulo = data.modulo || 'Módulo avulso';
        data.categoria = data.categoria || 'Padrão KB Tech';
        data.youtubeUrl = data.youtubeUrl || '';
        data.youtubeVideoId = data.youtubeVideoId || extractYouTubeId(data.youtubeUrl);
        data.duracao = data.duracao || 'A definir';
        data.ordem = Number(data.ordem || index + 1 || 1);
        data.publicoAlvo = data.publicoAlvo || 'Todos';
        data.obrigatorio = data.obrigatorio === true || data.obrigatorio === 'true';
        data.ativo = data.ativo !== false && data.ativo !== 'false';
        data.criadoEm = data.criadoEm || now;
        data.atualizadoEm = data.atualizadoEm || now;
        return data;
    }

    function buildInitialTrainings() {
        var now = new Date().toISOString();
        var list = [];
        moduleBlueprints.forEach(function(module) {
            module.lessons.forEach(function(title, lessonIndex) {
                var order = module.number * 100 + lessonIndex + 1;
                list.push(normalizeTraining({
                    id: 'kbtech-mod-' + module.number + '-aula-' + (lessonIndex + 1),
                    titulo: title,
                    descricao: 'Aula base para padronizar "' + title.toLowerCase() + '" dentro da operação KB Tech.',
                    modulo: 'Módulo ' + module.number + ' - ' + module.title,
                    categoria: module.category,
                    youtubeUrl: '',
                    youtubeVideoId: '',
                    duracao: '5 a 10 min',
                    ordem: order,
                    publicoAlvo: module.audience,
                    obrigatorio: module.required,
                    ativo: true,
                    criadoEm: now,
                    atualizadoEm: now
                }, order));
            });
        });
        return list;
    }

    function getLocalTrainings(seedIfEmpty) {
        var list = safeParse(TRAININGS_KEY, []);
        if ((!list || !list.length) && seedIfEmpty !== false) {
            list = buildInitialTrainings();
            saveLocalTrainings(list);
        }
        return (list || []).map(normalizeTraining).sort(function(a, b) {
            return Number(a.ordem || 0) - Number(b.ordem || 0);
        });
    }

    function getProgress() {
        return safeParse(PROGRESS_KEY, []);
    }

    function saveProgress(list) {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(list || []));
    }

    function getCurrentUserInfo() {
        try {
            if (window.firebase && firebase.auth && firebase.auth().currentUser) {
                var user = firebase.auth().currentUser;
                return {
                    id: user.uid,
                    name: user.displayName || user.email || 'Usuário KB Tech'
                };
            }
        } catch (err) {}
        return { id: 'local', name: 'Progresso local' };
    }

    function getCompletedTrainingIds() {
        var user = getCurrentUserInfo();
        return getProgress()
            .filter(function(item) { return item.usuarioId === user.id && item.concluido; })
            .map(function(item) { return item.treinamentoId; });
    }

    function markTrainingCompleted(training, checklistDone, notes) {
        var user = getCurrentUserInfo();
        var list = getProgress();
        var id = user.id + '-' + training.id;
        var existing = list.find(function(item) { return item.id === id; });
        var record = Object.assign(existing || {}, {
            id: id,
            usuarioId: user.id,
            usuarioNome: user.name,
            treinamentoId: training.id,
            tituloTreinamento: training.titulo,
            assistido: true,
            concluido: true,
            dataInicio: existing && existing.dataInicio ? existing.dataInicio : new Date().toISOString(),
            dataConclusao: new Date().toISOString(),
            checklistConcluido: checklistDone !== false,
            observacoes: notes || ''
        });

        if (existing) {
            list = list.map(function(item) { return item.id === id ? record : item; });
        } else {
            list.push(record);
        }

        saveProgress(list);
        saveProgressToFirestore(record);
        return record;
    }

    function extractYouTubeId(url) {
        if (!url) return '';
        var text = String(url).trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;
        var patterns = [
            /youtu\.be\/([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/watch\?[^#]*v=([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
        ];
        for (var i = 0; i < patterns.length; i++) {
            var match = text.match(patterns[i]);
            if (match && match[1]) return match[1];
        }
        return '';
    }

    function initCompatFirestore() {
        var cfg = window.KOS_FIREBASE_CONFIG || {};
        if (!window.firebase || !cfg.apiKey || !cfg.projectId || !firebase.firestore) return null;
        try {
            if (!firebase.apps.length) firebase.initializeApp(cfg);
            return firebase.firestore();
        } catch (err) {
            console.warn('Firebase indisponível para treinamentos.', err);
            return null;
        }
    }

    async function fetchTrainingsFromFirestore(timeoutMs) {
        var db = initCompatFirestore();
        if (!db) return [];
        var timeout = new Promise(function(resolve) {
            setTimeout(function() { resolve(null); }, timeoutMs || 6000);
        });
        try {
            var query = db.collection('treinamentos');
            try {
                if (!firebase.auth || !firebase.auth().currentUser) query = query.where('ativo', '==', true);
            } catch (err) {
                query = query.where('ativo', '==', true);
            }
            var snapshot = await Promise.race([query.get(), timeout]);
            if (!snapshot) return [];
            var list = [];
            snapshot.forEach(function(doc) {
                list.push(normalizeTraining(Object.assign({ id: doc.id }, doc.data())));
            });
            if (list.length) saveLocalTrainings(list);
            return list.sort(function(a, b) { return Number(a.ordem || 0) - Number(b.ordem || 0); });
        } catch (err) {
            console.warn('Falha ao buscar treinamentos no Firestore. Usando dados locais.', err);
            return [];
        }
    }

    async function saveProgressToFirestore(record) {
        var db = initCompatFirestore();
        if (!db) return;
        try {
            var user = getCurrentUserInfo();
            if (user.id === 'local') return;
            await db.collection('progressoTreinamentos').doc(record.id).set(record, { merge: true });
        } catch (err) {
            console.warn('Falha ao salvar progresso no Firestore. Progresso mantido localmente.', err);
        }
    }

    window.KBTechTrainings = {
        localKey: TRAININGS_KEY,
        progressKey: PROGRESS_KEY,
        categories: categories,
        audiences: audiences,
        moduleBlueprints: moduleBlueprints,
        operationChecklist: operationChecklist,
        buildInitialTrainings: buildInitialTrainings,
        getLocalTrainings: getLocalTrainings,
        saveLocalTrainings: saveLocalTrainings,
        normalizeTraining: normalizeTraining,
        getProgress: getProgress,
        saveProgress: saveProgress,
        getCompletedTrainingIds: getCompletedTrainingIds,
        markTrainingCompleted: markTrainingCompleted,
        extractYouTubeId: extractYouTubeId,
        fetchTrainingsFromFirestore: fetchTrainingsFromFirestore
    };
})();
