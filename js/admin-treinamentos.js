/* ============================================================
   KB Tech KOS - módulo Treinamentos
   ============================================================ */

(function() {
    var initialized = false;
    var currentEditId = '';

    function escapeHTML(value) {
        return String(value || '').replace(/[&<>"']/g, function(char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[char];
        });
    }

    function getTrainings(seed) {
        if (!window.KBTechTrainings) return [];
        return window.KBTechTrainings.getLocalTrainings(seed !== false);
    }

    function saveTrainings(list) {
        if (!window.KBTechTrainings) return;
        var normalized = (list || []).map(window.KBTechTrainings.normalizeTraining).sort(function(a, b) {
            return Number(a.ordem || 0) - Number(b.ordem || 0);
        });
        window.KBTechTrainings.saveLocalTrainings(normalized);
        if (window.KOSData) window.KOSData.saveCollection('trainings', normalized);
    }

    function getFilteredTrainings() {
        var search = (document.getElementById('training-admin-search') || {}).value || '';
        var category = (document.getElementById('training-admin-category-filter') || {}).value || '';
        var audience = (document.getElementById('training-admin-audience-filter') || {}).value || '';
        var query = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        return getTrainings(true).filter(function(item) {
            if (category && item.categoria !== category) return false;
            if (audience && item.publicoAlvo !== audience) return false;
            if (query) {
                var haystack = [
                    item.titulo,
                    item.descricao,
                    item.modulo,
                    item.categoria,
                    item.publicoAlvo
                ].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (haystack.indexOf(query) === -1) return false;
            }
            return true;
        }).sort(function(a, b) { return Number(a.ordem || 0) - Number(b.ordem || 0); });
    }

    function fillOptions() {
        fillSelect('training-categoria', window.KBTechTrainings.categories);
        fillSelect('training-publico', window.KBTechTrainings.audiences);
        fillSelect('training-admin-category-filter', window.KBTechTrainings.categories, 'Todas as categorias');
        fillSelect('training-admin-audience-filter', window.KBTechTrainings.audiences, 'Todos os públicos');
    }

    function fillSelect(id, values, placeholder) {
        var select = document.getElementById(id);
        if (!select || select.dataset.ready === '1') return;
        select.innerHTML = placeholder ? '<option value="">' + placeholder + '</option>' : '';
        (values || []).forEach(function(value) {
            var option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
        select.dataset.ready = '1';
    }

    function ensureTrainingModule() {
        if (!window.KBTechTrainings) return;

        var nav = document.querySelector('.admin-nav');
        if (nav && !document.querySelector('[data-tab="trainings"]')) {
            var btn = document.createElement('button');
            btn.className = 'admin-nav-btn';
            btn.setAttribute('data-tab', 'trainings');
            btn.innerHTML = '<i class="fas fa-graduation-cap"></i> Treinamentos';
            var backupBtn = document.querySelector('[data-tab="backup"]');
            nav.insertBefore(btn, backupBtn || null);
        }

        var main = document.querySelector('.admin-main');
        if (main && !document.getElementById('tab-trainings')) {
            var tab = document.createElement('div');
            tab.id = 'tab-trainings';
            tab.className = 'admin-tab';
            tab.style.display = 'none';
            tab.innerHTML =
                '<div class="admin-tab-header">' +
                    '<h1><i class="fas fa-graduation-cap"></i> Treinamentos KB Tech</h1>' +
                    '<div class="training-admin-actions">' +
                        '<a href="treinamentos.html" target="_blank" rel="noopener" class="btn-secondary-outline"><i class="fas fa-eye"></i> Ver página</a>' +
                        '<button id="btn-new-training" class="btn-primary"><i class="fas fa-plus"></i> Nova aula</button>' +
                    '</div>' +
                '</div>' +
                '<p class="admin-info-text">Cadastre aulas do YouTube para a Universidade KB Tech. Se o Firebase estiver online, as aulas são publicadas na coleção treinamentos.</p>' +
                '<div class="admin-stats training-admin-stats">' +
                    '<div class="stat-card"><span class="stat-number" id="training-admin-total">0</span><span class="stat-label">Aulas</span></div>' +
                    '<div class="stat-card"><span class="stat-number" id="training-admin-active">0</span><span class="stat-label">Ativas</span></div>' +
                    '<div class="stat-card"><span class="stat-number" id="training-admin-required">0</span><span class="stat-label">Obrigatórias</span></div>' +
                    '<div class="stat-card"><span class="stat-number" id="training-admin-modules">0</span><span class="stat-label">Módulos</span></div>' +
                '</div>' +
                '<div class="training-admin-grid">' +
                    '<form id="training-form" class="training-admin-form">' +
                        '<input type="hidden" id="training-id">' +
                        '<h3><i class="fas fa-pen"></i> Aula</h3>' +
                        '<div class="form-group"><label>Título *</label><input type="text" id="training-titulo" required placeholder="Ex: Como cadastrar cliente"></div>' +
                        '<div class="form-group"><label>Descrição</label><textarea id="training-descricao" rows="3" placeholder="Resumo objetivo da aula"></textarea></div>' +
                        '<div class="form-row">' +
                            '<div class="form-group"><label>Módulo</label><input type="text" id="training-modulo" placeholder="Módulo 1 - Comece por aqui"></div>' +
                            '<div class="form-group"><label>Ordem</label><input type="number" id="training-ordem" min="1" step="1"></div>' +
                        '</div>' +
                        '<div class="form-row">' +
                            '<div class="form-group"><label>Categoria</label><select id="training-categoria"></select></div>' +
                            '<div class="form-group"><label>Público-alvo</label><select id="training-publico"></select></div>' +
                        '</div>' +
                        '<div class="form-row">' +
                            '<div class="form-group"><label>Duração</label><input type="text" id="training-duracao" placeholder="Ex: 8 min"></div>' +
                            '<div class="form-group"><label>ID do YouTube</label><input type="text" id="training-youtube-id" placeholder="Preenchido automaticamente"></div>' +
                        '</div>' +
                        '<div class="form-group"><label>Link do YouTube</label><input type="url" id="training-youtube-url" placeholder="https://youtu.be/... ou link embed"></div>' +
                        '<div class="training-checkboxes">' +
                            '<label><input type="checkbox" id="training-obrigatorio"> Aula obrigatória</label>' +
                            '<label><input type="checkbox" id="training-ativo" checked> Publicar aula</label>' +
                        '</div>' +
                        '<div class="training-form-actions">' +
                            '<button type="submit" class="btn-primary"><i class="fas fa-save"></i> Salvar aula</button>' +
                            '<button type="button" id="btn-cancel-training" class="btn-secondary">Limpar</button>' +
                        '</div>' +
                    '</form>' +
                    '<div class="training-admin-preview" id="training-admin-preview">' +
                        '<div class="training-placeholder"><i class="fas fa-video"></i><strong>Prévia da aula</strong><p>Selecione uma aula ou cole um link do YouTube.</p></div>' +
                    '</div>' +
                '</div>' +
                '<div class="training-admin-toolbar">' +
                    '<input type="text" id="training-admin-search" placeholder="Buscar por aula, módulo, categoria ou público...">' +
                    '<select id="training-admin-category-filter"></select>' +
                    '<select id="training-admin-audience-filter"></select>' +
                    '<button type="button" id="btn-seed-trainings" class="btn-secondary-outline"><i class="fas fa-list-check"></i> Recriar aulas base</button>' +
                '</div>' +
                '<div class="admin-table-wrapper">' +
                    '<table class="admin-table">' +
                        '<thead><tr><th>Ordem</th><th>Aula</th><th>Categoria</th><th>Público</th><th>Obrigatória</th><th>Status</th><th>Vídeo</th><th>Ações</th></tr></thead>' +
                        '<tbody id="trainings-list"></tbody>' +
                    '</table>' +
                '</div>';

            var backupTab = document.getElementById('tab-backup');
            main.insertBefore(tab, backupTab || null);
        }
    }

    function initTrainingModule() {
        ensureTrainingModule();
        if (initialized || !document.getElementById('tab-trainings')) return;
        initialized = true;
        fillOptions();

        var form = document.getElementById('training-form');
        var newBtn = document.getElementById('btn-new-training');
        var cancelBtn = document.getElementById('btn-cancel-training');
        var urlInput = document.getElementById('training-youtube-url');
        var idInput = document.getElementById('training-youtube-id');
        var search = document.getElementById('training-admin-search');
        var catFilter = document.getElementById('training-admin-category-filter');
        var audienceFilter = document.getElementById('training-admin-audience-filter');
        var seedBtn = document.getElementById('btn-seed-trainings');
        var tbody = document.getElementById('trainings-list');

        if (form) form.addEventListener('submit', saveTrainingFromForm);
        if (newBtn) newBtn.addEventListener('click', resetTrainingForm);
        if (cancelBtn) cancelBtn.addEventListener('click', resetTrainingForm);
        if (urlInput && idInput) {
            urlInput.addEventListener('input', function() {
                idInput.value = window.KBTechTrainings.extractYouTubeId(urlInput.value);
                renderTrainingPreviewFromForm();
            });
            idInput.addEventListener('input', renderTrainingPreviewFromForm);
        }
        if (search) search.addEventListener('input', renderTrainings);
        if (catFilter) catFilter.addEventListener('change', renderTrainings);
        if (audienceFilter) audienceFilter.addEventListener('change', renderTrainings);
        if (seedBtn) {
            seedBtn.addEventListener('click', function() {
                if (!confirm('Recriar aulas base? Isso substitui a lista atual de treinamentos.')) return;
                saveTrainings(window.KBTechTrainings.buildInitialTrainings());
                resetTrainingForm();
                renderTrainings();
                showAdminToast('Aulas base recriadas.');
            });
        }
        if (tbody) {
            tbody.addEventListener('click', function(e) {
                var btn = e.target.closest('[data-training-action]');
                if (!btn) return;
                handleTrainingAction(btn.getAttribute('data-training-action'), btn.getAttribute('data-training-id'));
            });
        }

        if (window.KOSData && window.KOSData.isOnline()) {
            window.KOSData.fetchCollection('trainings').then(function(list) {
                if (list && list.length) {
                    window.KBTechTrainings.saveLocalTrainings(list);
                    renderTrainings();
                }
            }).catch(function(err) {
                console.warn('Falha ao carregar treinamentos do Firebase.', err);
            });
        }

        resetTrainingForm();
        renderTrainings();
    }

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function renderTrainings() {
        if (!window.KBTechTrainings) return;
        ensureTrainingModule();
        fillOptions();

        var all = getTrainings(true);
        var filtered = getFilteredTrainings();
        var modules = [];
        all.forEach(function(item) {
            if (modules.indexOf(item.modulo) === -1) modules.push(item.modulo);
        });

        setText('training-admin-total', all.length);
        setText('training-admin-active', all.filter(function(item) { return item.ativo; }).length);
        setText('training-admin-required', all.filter(function(item) { return item.obrigatorio; }).length);
        setText('training-admin-modules', modules.length);

        var tbody = document.getElementById('trainings-list');
        if (!tbody) return;
        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhuma aula encontrada.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function(item) {
            return '<tr class="' + (item.ativo ? '' : 'training-row-inactive') + '">' +
                '<td><strong>#' + Number(item.ordem || 0) + '</strong></td>' +
                '<td><strong>' + escapeHTML(item.titulo) + '</strong><br><small>' + escapeHTML(item.modulo) + '</small></td>' +
                '<td>' + escapeHTML(item.categoria) + '</td>' +
                '<td>' + escapeHTML(item.publicoAlvo) + '</td>' +
                '<td>' + (item.obrigatorio ? '<span class="training-badge required">Sim</span>' : '<span class="training-badge">Não</span>') + '</td>' +
                '<td>' + (item.ativo ? '<span class="training-badge active">Ativa</span>' : '<span class="training-badge inactive">Inativa</span>') + '</td>' +
                '<td>' + (item.youtubeVideoId ? '<span class="training-badge video">YouTube</span>' : '<span class="training-badge inactive">Pendente</span>') + '</td>' +
                '<td class="action-buttons">' +
                    '<button class="btn-icon" title="Subir ordem" data-training-action="up" data-training-id="' + escapeHTML(item.id) + '"><i class="fas fa-arrow-up"></i></button>' +
                    '<button class="btn-icon" title="Descer ordem" data-training-action="down" data-training-id="' + escapeHTML(item.id) + '"><i class="fas fa-arrow-down"></i></button>' +
                    '<button class="btn-icon" title="Visualizar" data-training-action="preview" data-training-id="' + escapeHTML(item.id) + '"><i class="fas fa-eye"></i></button>' +
                    '<button class="btn-icon" title="Editar" data-training-action="edit" data-training-id="' + escapeHTML(item.id) + '"><i class="fas fa-edit"></i></button>' +
                    '<button class="btn-icon" title="Ativar/Inativar" data-training-action="toggle" data-training-id="' + escapeHTML(item.id) + '"><i class="fas fa-toggle-on"></i></button>' +
                    '<button class="btn-icon danger" title="Excluir" data-training-action="delete" data-training-id="' + escapeHTML(item.id) + '"><i class="fas fa-trash"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function saveTrainingFromForm(e) {
        e.preventDefault();
        var list = getTrainings(true);
        var id = document.getElementById('training-id').value || ('treinamento-' + Date.now());
        var now = new Date().toISOString();
        var existing = list.find(function(item) { return item.id === id; });
        var youtubeUrl = document.getElementById('training-youtube-url').value.trim();
        var youtubeVideoId = document.getElementById('training-youtube-id').value.trim() || window.KBTechTrainings.extractYouTubeId(youtubeUrl);
        var item = window.KBTechTrainings.normalizeTraining({
            id: id,
            titulo: document.getElementById('training-titulo').value.trim(),
            descricao: document.getElementById('training-descricao').value.trim(),
            modulo: document.getElementById('training-modulo').value.trim() || 'Módulo avulso',
            categoria: document.getElementById('training-categoria').value || 'Padrão KB Tech',
            youtubeUrl: youtubeUrl,
            youtubeVideoId: youtubeVideoId,
            duracao: document.getElementById('training-duracao').value.trim() || 'A definir',
            ordem: Number(document.getElementById('training-ordem').value || list.length + 1),
            publicoAlvo: document.getElementById('training-publico').value || 'Todos',
            obrigatorio: document.getElementById('training-obrigatorio').checked,
            ativo: document.getElementById('training-ativo').checked,
            criadoEm: existing ? existing.criadoEm : now,
            atualizadoEm: now
        });

        if (!item.titulo) {
            showAdminToast('Informe o título da aula.', 'error');
            return;
        }

        if (existing) {
            list = list.map(function(training) { return training.id === id ? item : training; });
        } else {
            list.push(item);
        }

        saveTrainings(list);
        currentEditId = item.id;
        document.getElementById('training-id').value = item.id;
        renderTrainings();
        renderTrainingPreview(item);
        showAdminToast('Aula salva.');
    }

    function resetTrainingForm() {
        currentEditId = '';
        var form = document.getElementById('training-form');
        if (form) form.reset();
        document.getElementById('training-id').value = '';
        document.getElementById('training-categoria').value = 'Comece por aqui';
        document.getElementById('training-publico').value = 'Todos';
        document.getElementById('training-ativo').checked = true;
        document.getElementById('training-obrigatorio').checked = false;
        var nextOrder = getTrainings(true).reduce(function(max, item) {
            return Math.max(max, Number(item.ordem || 0));
        }, 0) + 1;
        document.getElementById('training-ordem').value = nextOrder;
        renderTrainingPreview(null);
    }

    function populateTrainingForm(item) {
        currentEditId = item.id;
        document.getElementById('training-id').value = item.id;
        document.getElementById('training-titulo').value = item.titulo || '';
        document.getElementById('training-descricao').value = item.descricao || '';
        document.getElementById('training-modulo').value = item.modulo || '';
        document.getElementById('training-categoria').value = item.categoria || 'Padrão KB Tech';
        document.getElementById('training-publico').value = item.publicoAlvo || 'Todos';
        document.getElementById('training-duracao').value = item.duracao || '';
        document.getElementById('training-ordem').value = item.ordem || '';
        document.getElementById('training-youtube-url').value = item.youtubeUrl || '';
        document.getElementById('training-youtube-id').value = item.youtubeVideoId || '';
        document.getElementById('training-obrigatorio').checked = !!item.obrigatorio;
        document.getElementById('training-ativo').checked = item.ativo !== false;
        renderTrainingPreview(item);
        document.getElementById('training-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderTrainingPreviewFromForm() {
        var youtubeUrl = document.getElementById('training-youtube-url').value.trim();
        var youtubeVideoId = document.getElementById('training-youtube-id').value.trim() || window.KBTechTrainings.extractYouTubeId(youtubeUrl);
        renderTrainingPreview({
            titulo: document.getElementById('training-titulo').value || 'Prévia da aula',
            descricao: document.getElementById('training-descricao').value || 'Confira o vídeo antes de publicar.',
            modulo: document.getElementById('training-modulo').value || 'Módulo',
            categoria: document.getElementById('training-categoria').value || 'Padrão KB Tech',
            publicoAlvo: document.getElementById('training-publico').value || 'Todos',
            duracao: document.getElementById('training-duracao').value || 'A definir',
            youtubeVideoId: youtubeVideoId
        });
    }

    function renderTrainingPreview(item) {
        var preview = document.getElementById('training-admin-preview');
        if (!preview) return;
        if (!item) {
            preview.innerHTML = '<div class="training-placeholder"><i class="fas fa-video"></i><strong>Prévia da aula</strong><p>Selecione uma aula ou cole um link do YouTube.</p></div>';
            return;
        }
        var video = item.youtubeVideoId
            ? '<div class="training-video-frame"><iframe src="https://www.youtube.com/embed/' + encodeURIComponent(item.youtubeVideoId) + '" title="' + escapeHTML(item.titulo) + '" loading="lazy" allowfullscreen></iframe></div>'
            : '<div class="training-placeholder"><i class="fas fa-video-slash"></i><strong>Vídeo ainda não cadastrado.</strong><p>Cole um link do YouTube para habilitar o player.</p></div>';
        preview.innerHTML = video +
            '<div class="training-admin-preview-info">' +
                '<span>' + escapeHTML(item.modulo || '') + '</span>' +
                '<h3>' + escapeHTML(item.titulo || '') + '</h3>' +
                '<p>' + escapeHTML(item.descricao || '') + '</p>' +
                '<small>' + escapeHTML(item.categoria || '') + ' • ' + escapeHTML(item.publicoAlvo || '') + ' • ' + escapeHTML(item.duracao || '') + '</small>' +
            '</div>';
    }

    function handleTrainingAction(action, id) {
        var list = getTrainings(true);
        var item = list.find(function(training) { return training.id === id; });
        if (!item) return;

        if (action === 'edit') {
            populateTrainingForm(item);
            return;
        }
        if (action === 'preview') {
            renderTrainingPreview(item);
            return;
        }
        if (action === 'toggle') {
            item.ativo = !item.ativo;
            item.atualizadoEm = new Date().toISOString();
            saveTrainings(list);
            renderTrainings();
            showAdminToast(item.ativo ? 'Aula ativada.' : 'Aula inativada.');
            return;
        }
        if (action === 'delete') {
            if (!confirm('Excluir esta aula?')) return;
            saveTrainings(list.filter(function(training) { return training.id !== id; }));
            if (currentEditId === id) resetTrainingForm();
            renderTrainings();
            showAdminToast('Aula excluída.');
            return;
        }
        if (action === 'up' || action === 'down') {
            moveTraining(id, action === 'up' ? -1 : 1);
        }
    }

    function moveTraining(id, direction) {
        var list = getTrainings(true).sort(function(a, b) {
            return Number(a.ordem || 0) - Number(b.ordem || 0);
        });
        var index = list.findIndex(function(item) { return item.id === id; });
        var nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= list.length) return;
        var currentOrder = list[index].ordem;
        list[index].ordem = list[nextIndex].ordem;
        list[nextIndex].ordem = currentOrder;
        list[index].atualizadoEm = new Date().toISOString();
        list[nextIndex].atualizadoEm = new Date().toISOString();
        saveTrainings(list);
        renderTrainings();
    }

    window.ensureTrainingModule = ensureTrainingModule;
    window.initTrainingModule = initTrainingModule;
    window.renderTrainings = renderTrainings;
    window.getTrainings = getTrainings;
    window.saveTrainings = saveTrainings;
})();
