/* ============================================================
   KB Tech - página Universidade KB Tech
   ============================================================ */

(function() {
    var state = {
        trainings: [],
        activeTrainingId: '',
        activeModule: '',
        search: '',
        category: '',
        audience: ''
    };

    function qs(selector) {
        return document.querySelector(selector);
    }

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

    function normalizeText(value) {
        return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function getVisibleTrainings() {
        var query = normalizeText(state.search);
        return state.trainings.filter(function(training) {
            if (!training.ativo) return false;
            if (state.activeModule && training.modulo !== state.activeModule) return false;
            if (state.category && training.categoria !== state.category) return false;
            if (state.audience && training.publicoAlvo !== state.audience && training.publicoAlvo !== 'Todos') return false;
            if (query) {
                var haystack = normalizeText([
                    training.titulo,
                    training.descricao,
                    training.modulo,
                    training.categoria,
                    training.publicoAlvo
                ].join(' '));
                if (haystack.indexOf(query) === -1) return false;
            }
            return true;
        }).sort(function(a, b) {
            return Number(a.ordem || 0) - Number(b.ordem || 0);
        });
    }

    function getModules() {
        var modules = [];
        state.trainings.forEach(function(training) {
            if (!training.ativo) return;
            var found = modules.find(function(item) { return item.name === training.modulo; });
            if (!found) {
                found = {
                    name: training.modulo,
                    category: training.categoria,
                    total: 0,
                    required: 0
                };
                modules.push(found);
            }
            found.total++;
            if (training.obrigatorio) found.required++;
        });
        return modules.sort(function(a, b) { return a.name.localeCompare(b.name); });
    }

    function renderSelectOptions() {
        var categoryFilter = qs('#training-category-filter');
        var audienceFilter = qs('#training-audience-filter');
        if (categoryFilter && categoryFilter.children.length <= 1) {
            window.KBTechTrainings.categories.forEach(function(category) {
                var option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
        if (audienceFilter && audienceFilter.children.length <= 1) {
            window.KBTechTrainings.audiences.forEach(function(audience) {
                var option = document.createElement('option');
                option.value = audience;
                option.textContent = audience;
                audienceFilter.appendChild(option);
            });
        }
    }

    function renderStats() {
        var active = state.trainings.filter(function(item) { return item.ativo; });
        var completed = window.KBTechTrainings.getCompletedTrainingIds();
        var completedVisible = active.filter(function(item) { return completed.indexOf(item.id) !== -1; }).length;
        var percent = active.length ? Math.round((completedVisible / active.length) * 100) : 0;

        setText('#training-stat-modules', getModules().length);
        setText('#training-stat-lessons', active.length);
        setText('#training-stat-required', active.filter(function(item) { return item.obrigatorio; }).length);
        setText('#training-stat-progress', percent + '%');

        var bar = qs('#training-progress-bar');
        if (bar) bar.style.width = percent + '%';
    }

    function setText(selector, value) {
        var el = qs(selector);
        if (el) el.textContent = value;
    }

    function renderModules() {
        var grid = qs('#training-module-grid');
        if (!grid) return;
        var modules = getModules();
        if (!modules.length) {
            grid.innerHTML = '<p class="empty-state"><i class="fas fa-video-slash"></i> Nenhum módulo ativo encontrado.</p>';
            return;
        }

        grid.innerHTML = modules.map(function(module) {
            var active = state.activeModule === module.name ? ' active' : '';
            return '<button class="training-module-card' + active + '" type="button" data-module="' + escapeHTML(module.name) + '">' +
                '<span class="training-module-icon"><i class="fas fa-graduation-cap"></i></span>' +
                '<strong>' + escapeHTML(module.name) + '</strong>' +
                '<small>' + module.total + ' aulas • ' + escapeHTML(module.category) + '</small>' +
                (module.required ? '<em>' + module.required + ' obrigatórias</em>' : '<em>Complementar</em>') +
            '</button>';
        }).join('');
    }

    function renderList() {
        var listEl = qs('#training-list');
        if (!listEl) return;
        var trainings = getVisibleTrainings();
        var completed = window.KBTechTrainings.getCompletedTrainingIds();

        setText('#training-visible-count', trainings.length);

        if (!trainings.length) {
            listEl.innerHTML = '<div class="training-empty"><i class="fas fa-search"></i><p>Nenhuma aula encontrada com esses filtros.</p></div>';
            renderPlayer(null);
            return;
        }

        if (!state.activeTrainingId || !trainings.find(function(item) { return item.id === state.activeTrainingId; })) {
            state.activeTrainingId = trainings[0].id;
        }

        listEl.innerHTML = trainings.map(function(training) {
            var active = training.id === state.activeTrainingId ? ' active' : '';
            var done = completed.indexOf(training.id) !== -1;
            return '<article class="training-video-card' + active + '" data-training-id="' + escapeHTML(training.id) + '">' +
                '<div class="training-card-main">' +
                    '<span class="training-card-order">#' + Number(training.ordem || 0) + '</span>' +
                    '<div>' +
                        '<h3>' + escapeHTML(training.titulo) + '</h3>' +
                        '<p>' + escapeHTML(training.descricao) + '</p>' +
                        '<div class="training-card-tags">' +
                            '<span>' + escapeHTML(training.categoria) + '</span>' +
                            '<span>' + escapeHTML(training.publicoAlvo) + '</span>' +
                            '<span>' + escapeHTML(training.duracao) + '</span>' +
                            (training.obrigatorio ? '<span class="required">Obrigatório</span>' : '') +
                            (done ? '<span class="done">Concluído</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="btn-secondary btn-watch-training" data-training-id="' + escapeHTML(training.id) + '">' +
                    '<i class="fas fa-play"></i> Assistir' +
                '</button>' +
            '</article>';
        }).join('');

        renderPlayer(trainings.find(function(item) { return item.id === state.activeTrainingId; }));
    }

    function renderPlayer(training) {
        var player = qs('#training-player');
        if (!player) return;
        if (!training) {
            player.innerHTML = '<div class="training-placeholder"><i class="fas fa-video"></i><strong>Selecione uma aula</strong><p>Escolha um treinamento na lista para assistir.</p></div>';
            return;
        }

        var completed = window.KBTechTrainings.getCompletedTrainingIds().indexOf(training.id) !== -1;
        var videoHtml = training.youtubeVideoId
            ? '<div class="training-video-frame"><iframe src="https://www.youtube.com/embed/' + encodeURIComponent(training.youtubeVideoId) + '" title="' + escapeHTML(training.titulo) + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>'
            : '<div class="training-placeholder"><i class="fas fa-video-slash"></i><strong>Vídeo ainda não cadastrado.</strong><p>O administrador pode colar o link do YouTube no KOS.</p></div>';

        player.innerHTML = videoHtml +
            '<div class="training-player-info">' +
                '<span class="training-kicker">' + escapeHTML(training.modulo) + '</span>' +
                '<h2>' + escapeHTML(training.titulo) + '</h2>' +
                '<p>' + escapeHTML(training.descricao) + '</p>' +
                '<div class="training-meta">' +
                    '<span><i class="fas fa-layer-group"></i> ' + escapeHTML(training.categoria) + '</span>' +
                    '<span><i class="fas fa-users"></i> ' + escapeHTML(training.publicoAlvo) + '</span>' +
                    '<span><i class="fas fa-clock"></i> ' + escapeHTML(training.duracao) + '</span>' +
                    (training.obrigatorio ? '<span><i class="fas fa-star"></i> Obrigatório</span>' : '<span><i class="fas fa-book-open"></i> Complementar</span>') +
                '</div>' +
                '<div class="training-player-actions">' +
                    '<button type="button" class="btn-primary" id="btn-complete-training" data-training-id="' + escapeHTML(training.id) + '">' +
                        '<i class="fas ' + (completed ? 'fa-check-circle' : 'fa-check') + '"></i> ' + (completed ? 'Concluído' : 'Marcar como concluído') +
                    '</button>' +
                    (training.youtubeVideoId ? '<a class="btn-secondary" href="https://www.youtube.com/watch?v=' + encodeURIComponent(training.youtubeVideoId) + '" target="_blank" rel="noopener"><i class="fab fa-youtube"></i> Abrir no YouTube</a>' : '') +
                '</div>' +
            '</div>';
    }

    function renderChecklist() {
        var el = qs('#training-checklist');
        if (!el) return;
        el.innerHTML = window.KBTechTrainings.operationChecklist.map(function(item) {
            return '<li><i class="fas fa-check"></i> ' + escapeHTML(item) + '</li>';
        }).join('');
    }

    function renderAll() {
        renderSelectOptions();
        renderStats();
        renderModules();
        renderList();
        renderChecklist();
    }

    function bindEvents() {
        var search = qs('#training-search');
        var category = qs('#training-category-filter');
        var audience = qs('#training-audience-filter');
        var clear = qs('#training-clear-filters');

        if (search) search.addEventListener('input', function(e) {
            state.search = e.target.value;
            renderList();
        });
        if (category) category.addEventListener('change', function(e) {
            state.category = e.target.value;
            renderModules();
            renderList();
        });
        if (audience) audience.addEventListener('change', function(e) {
            state.audience = e.target.value;
            renderList();
        });
        if (clear) clear.addEventListener('click', function() {
            state.search = '';
            state.category = '';
            state.audience = '';
            state.activeModule = '';
            if (search) search.value = '';
            if (category) category.value = '';
            if (audience) audience.value = '';
            renderAll();
        });

        document.addEventListener('click', function(e) {
            var moduleCard = e.target.closest('[data-module]');
            if (moduleCard && moduleCard.classList.contains('training-module-card')) {
                var module = moduleCard.getAttribute('data-module');
                state.activeModule = state.activeModule === module ? '' : module;
                state.activeTrainingId = '';
                renderModules();
                renderList();
                return;
            }

            var watchBtn = e.target.closest('.btn-watch-training');
            var card = e.target.closest('.training-video-card');
            var id = watchBtn ? watchBtn.getAttribute('data-training-id') : (card ? card.getAttribute('data-training-id') : '');
            if (id) {
                state.activeTrainingId = id;
                renderList();
                var player = qs('#training-player');
                if (player && window.innerWidth <= 900) player.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            var completeBtn = e.target.closest('#btn-complete-training');
            if (completeBtn) {
                var training = state.trainings.find(function(item) { return item.id === completeBtn.getAttribute('data-training-id'); });
                if (training) {
                    window.KBTechTrainings.markTrainingCompleted(training, true, '');
                    renderStats();
                    renderList();
                }
            }
        });
    }

    async function init() {
        if (!window.KBTechTrainings) return;
        state.trainings = window.KBTechTrainings.getLocalTrainings(true);
        renderAll();
        bindEvents();

        var remote = await window.KBTechTrainings.fetchTrainingsFromFirestore(6000);
        if (remote && remote.length) {
            state.trainings = remote;
            state.activeTrainingId = '';
            renderAll();
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
