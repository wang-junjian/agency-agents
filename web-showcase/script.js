document.addEventListener('DOMContentLoaded', () => {
    const agentGrid = document.getElementById('agent-grid');
    const categoryList = document.getElementById('category-list');
    const searchInput = document.getElementById('search-input');
    const agentCount = document.getElementById('agent-count');
    
    // Modal elements
    const modal = document.getElementById('agent-modal');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');
    const copyButton = document.getElementById('copy-button');
    
    let allAgents = [];
    let categories = new Set();
    let currentMarkdown = '';

    // Fetch the data
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allAgents = data;
            renderAgents(allAgents);
            extractCategories(allAgents);
            renderCategories();
        })
        .catch(err => {
            console.error('Error loading agent data:', err);
            agentGrid.innerHTML = `<div class="error">无法加载数据，请确保已运行数据提取脚本。</div>`;
        });

    function renderAgents(agents) {
        agentGrid.innerHTML = '';
        agentCount.textContent = agents.length;
        
        agents.forEach((agent, index) => {
            const card = document.createElement('div');
            card.className = 'agent-card';
            card.style.animationDelay = `${index * 0.02}s`;
            
            card.innerHTML = `
                <div class="agent-icon">${agent.icon || '🤖'}</div>
                <div class="agent-name">${agent.name}</div>
                <div class="agent-category">${agent.category_zh}</div>
                <div class="agent-specialty">${agent.specialty}</div>
                <div class="agent-usecase">${agent.use_case}</div>
            `;

            // Click event to open modal
            card.addEventListener('click', () => {
                if (agent.link && agent.link !== '#') {
                    openModal(agent.link);
                }
            });

            agentGrid.appendChild(card);
        });
    }

    // Modal Functions
    function openModal(link) {
        modalBody.innerHTML = '<div class="loading">正在加载内容...</div>';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling

        // Links are relative to the project root
        // If data.json has "/engineering/..." it works as absolute path from server root
        const fetchUrl = link.startsWith('/') ? link : `/${link}`;

        fetch(fetchUrl)
            .then(response => {
                if (!response.ok) throw new Error('无法获取文档内容');
                return response.text();
            })
            .then(text => {
                currentMarkdown = text;
                modalBody.innerHTML = marked.parse(text);
            })
            .catch(err => {
                modalBody.innerHTML = `<div class="error">出错了: ${err.message}</div>`;
            });
    }

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    }

    closeButton.addEventListener('click', closeModal);
    
    copyButton.addEventListener('click', () => {
        if (!currentMarkdown) return;
        
        navigator.clipboard.writeText(currentMarkdown).then(() => {
            const originalText = copyButton.textContent;
            copyButton.textContent = '已复制！';
            
            setTimeout(() => {
                copyButton.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('无法复制内容:', err);
            copyButton.textContent = '复制失败';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
    });

    function extractCategories(agents) {
        agents.forEach(agent => {
            if (agent.category_zh) {
                categories.add(agent.category_zh);
            }
        });
    }

    function renderCategories() {
        // Clear except the "All" item
        const allItem = categoryList.querySelector('[data-category="all"]');
        categoryList.innerHTML = '';
        categoryList.appendChild(allItem);

        const sortedCategories = Array.from(categories).sort();
        sortedCategories.forEach(cat => {
            const li = document.createElement('li');
            li.textContent = cat;
            li.setAttribute('data-category', cat);
            li.addEventListener('click', () => {
                filterByCategory(cat);
                updateActiveCategory(li);
            });
            categoryList.appendChild(li);
        });
        
        allItem.addEventListener('click', () => {
            renderAgents(allAgents);
            updateActiveCategory(allItem);
        });
    }

    function filterByCategory(category) {
        const filtered = allAgents.filter(agent => agent.category_zh === category);
        renderAgents(filtered);
    }

    function updateActiveCategory(activeItem) {
        document.querySelectorAll('#category-list li').forEach(li => li.classList.remove('active'));
        activeItem.classList.add('active');
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allAgents.filter(agent => {
            return (
                agent.name.toLowerCase().includes(query) ||
                agent.specialty.toLowerCase().includes(query) ||
                agent.category_zh.toLowerCase().includes(query) ||
                agent.use_case.toLowerCase().includes(query)
            );
        });
        renderAgents(filtered);
        
        // Reset category highlighting
        document.querySelectorAll('#category-list li').forEach(li => li.classList.remove('active'));
        if (query === '') {
            document.querySelector('[data-category="all"]').classList.add('active');
        }
    });

    // Handle smooth entry animation reset on category change
    function resetAnimations() {
        const cards = document.querySelectorAll('.agent-card');
        cards.forEach((card, index) => {
            card.style.animation = 'none';
            card.offsetHeight; // trigger reflow
            card.style.animation = null;
        });
    }
});
