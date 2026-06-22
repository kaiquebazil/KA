/* ============================================================
   KB Tech KOS - importador de produtos de fornecedor local
   ============================================================ */

(function() {
    var initialized = false;
    var previewProducts = [];
    var PLACEHOLDER_IMAGE = 'img/produto-placeholder.svg';

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

    function parseBRL(value) {
        var text = String(value || '').replace(/[^\d,.-]/g, '').trim();
        if (!text) return 0;
        if (text.indexOf(',') !== -1) text = text.replace(/\./g, '').replace(',', '.');
        return parseFloat(text) || 0;
    }

    function formatBRLLocal(value) {
        return 'R$ ' + (parseFloat(value) || 0).toFixed(2).replace('.', ',');
    }

    function normalizeText(value) {
        return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function classifyCategory(row) {
        var text = normalizeText([row.fabricante, row.modelo, row.especificacao].join(' '));
        if (/echo dot|echo pop|alexa/.test(text)) return 'Smart Home';
        if (/fire tv|tv stick|mi tv stick|chromecast|roku/.test(text)) return 'Streaming';
        if (/redmi pad|tablet|ipad/.test(text)) return 'Tablets';
        if (/poco|realme|redmi|xiaomi|samsung galaxy|iphone|motorola|moto g|celular|smartphone/.test(text)) return 'Celulares';
        if (/ssd|kingston a400|alltek/.test(text)) return 'SSD e Armazenamento';
        if (/hd externo|hdd externo|external hd/.test(text)) return 'HD Externo';
        if (/pen ?drive|pendrive|usb flash/.test(text)) return 'Pendrives';
        if (/microsd|micro sd|cartao de memoria|cartao memoria|memory card/.test(text)) return 'Cartoes de Memoria';
        if (/logitech m170|mouse|mouses/.test(text)) return 'Mouses';
        if (/baofeng|bf-777s|radio comunicador|walkie/.test(text)) return 'Radio Comunicador';
        return 'Acessorios de Tecnologia';
    }

    function defaultMargin(category) {
        if (/celulares|tablets/i.test(category)) return 15;
        if (/streaming|smart home/i.test(category)) return 20;
        if (/ssd|armazenamento|hd externo/i.test(category)) return 25;
        if (/pendrives|cartoes/i.test(category)) return 30;
        return 30;
    }

    function roundCommercial(value) {
        value = parseFloat(value) || 0;
        if (value <= 0) return 0;
        var step = value < 60 ? 10 : value < 250 ? 20 : value < 1200 ? 50 : 100;
        return Math.max(9.9, Math.ceil(value / step) * step - 0.1);
    }

    function buildProductName(row, category) {
        var parts = [row.fabricante, row.modelo, row.especificacao].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
        if (!parts) parts = 'Produto KB Tech';
        if (!/petropolis/i.test(normalizeText(parts))) parts += ' em Petropolis';
        return parts;
    }

    function splitLine(line) {
        var delimiters = ['\t', ';', '|'];
        for (var i = 0; i < delimiters.length; i++) {
            if (line.indexOf(delimiters[i]) !== -1) {
                return line.split(delimiters[i]).map(function(part) { return part.trim(); }).filter(Boolean);
            }
        }
        var csv = line.split(',').map(function(part) { return part.trim(); }).filter(Boolean);
        if (csv.length >= 4) return csv;
        return [];
    }

    function parseProductLine(line) {
        var clean = String(line || '').trim();
        if (!clean) return null;
        if (/fabricante|modelo|especifica/i.test(clean) && /preco|preço|valor/i.test(clean)) return null;

        var parts = splitLine(clean);
        if (parts.length >= 4) {
            return {
                fabricante: parts[0],
                modelo: parts[1],
                especificacao: parts.slice(2, parts.length - 1).join(' '),
                precoBase: parseBRL(parts[parts.length - 1])
            };
        }

        var match = clean.match(/^(.*?)(?:\s+R?\$?\s*)(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[,.]\d{2}|\d+)$/);
        if (!match) return null;
        var description = match[1].trim();
        var tokens = description.split(/\s+/);
        return {
            fabricante: tokens.shift() || '',
            modelo: tokens.join(' '),
            especificacao: '',
            precoBase: parseBRL(match[2])
        };
    }

    function buildProduct(row, index) {
        var category = classifyCategory(row);
        var margin = defaultMargin(category);
        var base = parseFloat(row.precoBase) || 0;
        var name = buildProductName(row, category);
        var priceDraft = {
            nome: name,
            fabricante: row.fabricante || '',
            marca: row.fabricante || '',
            modelo: row.modelo || '',
            categoria: category,
            especificacao: row.especificacao || '',
            precoFornecedor: base,
            custoFornecedor: base,
            precoCusto: base,
            margem: margin,
            tipoEstoque: 'fornecedor local',
            statusDisponibilidade: 'Consultar disponibilidade'
        };
        var sale = typeof calculateFairSalePrice === 'function'
            ? calculateFairSalePrice(priceDraft)
            : roundCommercial(base * (1 + margin / 100));
        var now = new Date().toISOString();

        return {
            id: Date.now() + index,
            nome: name,
            fabricante: row.fabricante || '',
            marca: row.fabricante || '',
            modelo: row.modelo || '',
            categoria: category,
            descricao: row.especificacao || ('Produto ' + category + ' com disponibilidade sob consulta na KB Tech.'),
            especificacao: row.especificacao || '',
            precoCusto: base,
            precoVenda: sale,
            precoFornecedor: base,
            custoFornecedor: base,
            margem: margin,
            estoque: 0,
            estoqueMinimo: 0,
            estoqueMin: 0,
            tipoEstoque: 'fornecedor local',
            statusDisponibilidade: 'Consultar disponibilidade',
            fornecedorPrincipalNome: 'Fornecedor local',
            fornecedor: 'Fornecedor local',
            fornecedorWhatsapp: '',
            imagem: PLACEHOLDER_IMAGE,
            alt: name + ' vendido pela KB Tech em Petropolis',
            ativo: true,
            destaque: false,
            oferta: false,
            maisVendido: false,
            observacoes: 'Importado por lista de fornecedor. Confirmar imagem e disponibilidade antes de prometer ao cliente.',
            observacoesFornecedor: row.especificacao || '',
            criadoEm: now,
            atualizadoEm: now
        };
    }

    function parseImportText() {
        var textarea = document.getElementById('product-bulk-input');
        var text = textarea ? textarea.value : '';
        var rows = text.split(/\r?\n/).map(parseProductLine).filter(function(row) {
            return row && row.precoBase > 0 && (row.fabricante || row.modelo);
        });
        return rows.map(buildProduct);
    }

    function ensureProductImporter() {
        var tab = document.getElementById('tab-products');
        if (!tab || document.getElementById('product-import-panel')) return;
        var searchBar = tab.querySelector('.admin-search-bar');
        var panel = document.createElement('div');
        panel.id = 'product-import-panel';
        panel.className = 'product-import-panel';
        panel.innerHTML =
            '<div class="product-import-header">' +
                '<div><h3><i class="fas fa-file-import"></i> Importar lista de produtos</h3><p>Cole a lista com Fabricante, Modelo, Especificacao e Preco base. O KOS calcula categoria, margem e preco de venda.</p></div>' +
                '<button type="button" id="btn-toggle-product-import" class="btn-secondary-outline"><i class="fas fa-chevron-down"></i> Abrir importador</button>' +
            '</div>' +
            '<div class="product-import-body" id="product-import-body" style="display:none;">' +
                '<textarea id="product-bulk-input" rows="8" placeholder="Fabricante;Modelo;Especificacao;Preco base\\nAmazon;Echo Dot 5a Geracao;Preto;349,00\\nKingston;SSD A400;240GB;139,00"></textarea>' +
                '<div class="product-import-actions">' +
                    '<button type="button" id="btn-preview-products-import" class="btn-secondary"><i class="fas fa-eye"></i> Pre-visualizar</button>' +
                    '<button type="button" id="btn-run-products-import" class="btn-primary"><i class="fas fa-upload"></i> Importar para o KOS</button>' +
                    '<button type="button" id="btn-reprice-products" class="btn-secondary-outline"><i class="fas fa-tags"></i> Recalcular precos de venda</button>' +
                    '<button type="button" id="btn-clear-products-import" class="btn-danger-outline"><i class="fas fa-trash"></i> Limpar</button>' +
                '</div>' +
                '<div class="product-import-help">Padrao aceito: colunas separadas por ponto e virgula, TAB, pipe ou virgula. Sem imagem confiavel, o produto usa placeholder local.</div>' +
                '<div id="product-import-preview" class="product-import-preview"></div>' +
            '</div>';
        if (searchBar) searchBar.insertAdjacentElement('afterend', panel);
        else tab.insertBefore(panel, tab.firstChild);
    }

    function renderPreview() {
        var target = document.getElementById('product-import-preview');
        if (!target) return;
        previewProducts = parseImportText();
        if (!previewProducts.length) {
            target.innerHTML = '<p class="empty-state"><i class="fas fa-info-circle"></i> Nenhum produto valido encontrado na lista.</p>';
            return;
        }
        target.innerHTML =
            '<div class="admin-table-wrapper"><table class="admin-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Base</th><th>Margem</th><th>Venda</th><th>Status</th></tr></thead><tbody>' +
            previewProducts.slice(0, 80).map(function(p) {
                return '<tr><td><strong>' + escapeHTML(p.nome) + '</strong><br><small>' + escapeHTML([p.marca, p.modelo].filter(Boolean).join(' ')) + '</small></td><td>' + escapeHTML(p.categoria) + '</td><td>' + formatBRLLocal(p.precoCusto) + '</td><td>' + p.margem + '%</td><td>' + formatBRLLocal(p.precoVenda) + '</td><td>' + escapeHTML(p.statusDisponibilidade) + '</td></tr>';
            }).join('') +
            '</tbody></table></div>' +
            (previewProducts.length > 80 ? '<p class="admin-info-text">Mostrando 80 de ' + previewProducts.length + ' produtos na pre-visualizacao.</p>' : '');
    }

    function importProducts() {
        if (!previewProducts.length) previewProducts = parseImportText();
        if (!previewProducts.length) {
            if (typeof showAdminToast === 'function') showAdminToast('Cole uma lista valida antes de importar.', 'error');
            return;
        }

        var products = getProducts();
        var imported = 0;
        previewProducts.forEach(function(newProduct) {
            var exists = products.some(function(p) {
                return normalizeText(p.nome) === normalizeText(newProduct.nome) ||
                    (normalizeText(p.marca) === normalizeText(newProduct.marca) && normalizeText(p.modelo) === normalizeText(newProduct.modelo) && normalizeText(p.especificacao) === normalizeText(newProduct.especificacao));
            });
            if (!exists) {
                products.push(newProduct);
                imported++;
            }
        });

        saveProducts(products);
        if (typeof renderAdminProducts === 'function') renderAdminProducts();
        if (typeof renderCategories === 'function') renderCategories();
        if (typeof renderProducts === 'function') renderProducts();
        if (typeof showAdminToast === 'function') showAdminToast(imported + ' produtos importados para o KOS.');
        renderPreview();
    }

    function readRawProducts() {
        try {
            var raw = localStorage.getItem(PRODUCTS_KEY);
            return raw ? JSON.parse(raw) || [] : [];
        } catch (err) {
            console.warn('[KB Tech] Nao foi possivel ler produtos salvos para recalcular precos.', err);
            return [];
        }
    }

    function shouldRepriceRawProduct(product, sale, base) {
        var inventoryText = normalizeText([product.tipoEstoque, product.statusDisponibilidade].join(' '));
        var hasSupplierCost = parseFloat(product.precoFornecedor || product.custoFornecedor) > 0;
        if (!hasSupplierCost && !/fornecedor|consulta|sob consulta/.test(inventoryText)) return false;
        if (typeof shouldAutoPriceProduct === 'function') return shouldAutoPriceProduct(product, sale, base);
        return base > 0 && (sale <= 0 || sale <= base + 0.01);
    }

    function repriceExistingProducts() {
        if (typeof saveProducts !== 'function' || typeof calculateFairSalePrice !== 'function') {
            if (typeof showAdminToast === 'function') showAdminToast('Calculo de precos ainda nao carregado.', 'error');
            return;
        }

        if (typeof initProducts === 'function') initProducts();
        var products = readRawProducts();
        if (!products.length && typeof getProducts === 'function') products = getProducts();
        if (!products.length) {
            if (typeof showAdminToast === 'function') showAdminToast('Nenhum produto encontrado para recalcular.', 'warning');
            return;
        }

        var changed = 0;
        var repriced = products.map(function(product) {
            var base = parseFloat(product.precoFornecedor || product.custoFornecedor || product.precoCusto || product.custo) || 0;
            var currentSale = parseFloat(product.precoVenda || product.preco) || 0;
            if (shouldRepriceRawProduct(product, currentSale, base)) {
                var fairSale = calculateFairSalePrice(Object.assign({}, product, {
                    precoFornecedor: product.precoFornecedor || base,
                    custoFornecedor: product.custoFornecedor || base,
                    precoCusto: product.precoCusto || base,
                    tipoEstoque: product.tipoEstoque || 'fornecedor local',
                    statusDisponibilidade: product.statusDisponibilidade || 'Consultar disponibilidade'
                }));
                if (fairSale > 0 && Math.abs(fairSale - currentSale) > 0.01) {
                    product.precoVenda = fairSale;
                    product.preco = fairSale;
                    product.atualizadoEm = new Date().toISOString();
                    changed++;
                }
            }
            return product;
        });

        saveProducts(repriced);
        if (typeof renderAdminProducts === 'function') renderAdminProducts();
        if (typeof renderCategories === 'function') renderCategories();
        if (typeof renderProducts === 'function') renderProducts();
        if (typeof showAdminToast === 'function') {
            showAdminToast(changed ? changed + ' produtos atualizados com preco de venda.' : 'Nenhum produto precisava de reajuste.');
        }
        renderPreview();
    }

    function initProductImporter() {
        ensureProductImporter();
        if (initialized || !document.getElementById('product-import-panel')) return;
        initialized = true;

        document.getElementById('btn-toggle-product-import').addEventListener('click', function() {
            var body = document.getElementById('product-import-body');
            var open = body.style.display !== 'none';
            body.style.display = open ? 'none' : 'block';
            this.innerHTML = open ? '<i class="fas fa-chevron-down"></i> Abrir importador' : '<i class="fas fa-chevron-up"></i> Fechar importador';
        });
        document.getElementById('btn-preview-products-import').addEventListener('click', renderPreview);
        document.getElementById('btn-run-products-import').addEventListener('click', importProducts);
        document.getElementById('btn-reprice-products').addEventListener('click', repriceExistingProducts);
        document.getElementById('btn-clear-products-import').addEventListener('click', function() {
            document.getElementById('product-bulk-input').value = '';
            previewProducts = [];
            renderPreview();
        });
    }

    window.ensureProductImporter = ensureProductImporter;
    window.initProductImporter = initProductImporter;
    window.parseKOSProductImportText = parseImportText;
})();
