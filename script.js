class WindowManager {
    constructor() {
        this.zIndex = 1000;
    }

    createWindow(title, content, x = 100, y = 100, extraClass = '') {
        const windowEl = document.createElement('div');
        windowEl.className = `window ${extraClass}`;
        windowEl.style.left = `${x}px`;
        windowEl.style.top = `${y}px`;
        windowEl.style.zIndex = this.zIndex++;

        windowEl.innerHTML = `
            <div class="window-header">
                <span>${title}</span>
                <div class="window-controls">
                    <div class="window-control window-minimize"></div>
                    <div class="window-control window-maximize"></div>
                    <div class="window-control window-close"></div>
                </div>
            </div>
            <div class="window-content">${content}</div>
        `;

        const closeBtn = windowEl.querySelector('.window-close');
        const maxBtn = windowEl.querySelector('.window-maximize');
        const minBtn = windowEl.querySelector('.window-minimize');

        closeBtn.onclick = () => windowEl.remove();
        maxBtn.onclick = () => this.maximizeWindow(windowEl);
        minBtn.onclick = () => this.minimizeWindow(windowEl);

        this.makeDraggable(windowEl);

        document.querySelector('.windows-container').appendChild(windowEl);
        return windowEl;
    }

    maximizeWindow(windowEl) {
        windowEl.classList.toggle('maximized');
        if (windowEl.classList.contains('maximized')) {
            windowEl.style.width = '100%';
            windowEl.style.height = 'calc(100vh - 40px)';
            windowEl.style.top = '0';
            windowEl.style.left = '0';
        }
    }

    minimizeWindow(windowEl) {
        windowEl.classList.toggle('minimized');
    }

    makeDraggable(windowEl) {
        const header = windowEl.querySelector('.window-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        header.onmousedown = (e) => {
            if (e.target.closest('.window-controls')) return;
            isDragging = true;
            initialX = e.clientX - windowEl.offsetLeft;
            initialY = e.clientY - windowEl.offsetTop;
            windowEl.style.zIndex = this.zIndex++;
        };

        document.onmousemove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            windowEl.style.left = `${currentX}px`;
            windowEl.style.top = `${currentY}px`;
        };

        document.onmouseup = () => {
            isDragging = false;
        };
    }
}

class WebAppManager {
    constructor() {
        this.apps = [];
        this.initializeEvents();
    }

    loadApps() {
        return this.apps;
    }

    createAppIcon(app) {
        const icon = document.createElement('div');
        icon.className = 'icon';
        icon.dataset.app = 'webapp';
        icon.dataset.id = crypto.randomUUID();
        
        icon.innerHTML = `
            <i class="fas fa-globe"></i>
            <span>${app.title}</span>
        `;
        
        icon.onclick = () => {
            const width = Math.floor(window.innerWidth * 0.8);
            const height = Math.floor(window.innerHeight * 0.8);
            const left = Math.floor((window.innerWidth - width) / 2);
            const top = Math.floor((window.innerHeight - height) / 2);

            const windowEl = window.windowManager.createWindow(
                app.title,
                `<iframe src="${app.url}" style="width: 100%; height: 100%; border: none;"></iframe>`,
                left,
                top,
                'webapp-window'
            );

            if (windowEl) {
                windowEl.style.width = `${width}px`;
                windowEl.style.height = `${height}px`;
            }
        };

        document.querySelector('.desktop-icons').appendChild(icon);
        this.arrangeIcons();
    }

    arrangeIcons() {
        const icons = document.querySelectorAll('.icon[data-app="webapp"]');
        const desktop = document.querySelector('.desktop-icons');
        const taskbar = document.querySelector('.taskbar');
        const systemIcons = document.querySelectorAll('.icon:not([data-app="webapp"])');
        
        // Tüm mevcut pozisyonları topla (sistem ikonları dahil)
        const occupiedPositions = new Set();
        systemIcons.forEach(icon => {
            const rect = icon.getBoundingClientRect();
            const pos = `${Math.round(rect.left)},${Math.round(rect.top)}`;
            occupiedPositions.add(pos);
        });

        const gridGap = 20;
        const iconWidth = 80;
        const iconHeight = 100;
        const usableHeight = desktop.clientHeight - taskbar.offsetHeight - gridGap;
        const iconsPerRow = Math.floor((desktop.clientWidth - gridGap) / (iconWidth + gridGap));

        icons.forEach((icon) => {
            let placed = false;
            let row = 0;
            let col = 0;

            // Boş bir pozisyon bul
            while (!placed) {
                const left = gridGap + (col * (iconWidth + gridGap));
                const top = gridGap + (row * (iconHeight + gridGap));

                // Pozisyonun dolu olup olmadığını kontrol et
                const pos = `${left},${top}`;
                if (!occupiedPositions.has(pos) && top + iconHeight < usableHeight) {
                    icon.style.position = 'absolute';
                    icon.style.left = `${left}px`;
                    icon.style.top = `${top}px`;
                    occupiedPositions.add(pos);
                    placed = true;
                } else {
                    // Sonraki pozisyona geç
                    col++;
                    if (col >= iconsPerRow) {
                        col = 0;
                        row++;
                    }
                }
            }
        });
    }

    makeDraggable(icon) {
        let isDragging = false;
        let startX, startY;
        let originalX, originalY;

        icon.onmousedown = (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            originalX = icon.offsetLeft;
            originalY = icon.offsetTop;
            icon.style.zIndex = '1000';
            icon.style.opacity = '0.7';
        };

        document.onmousemove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            icon.style.left = `${originalX + dx}px`;
            icon.style.top = `${originalY + dy}px`;
        };

        document.onmouseup = (e) => {
            if (!isDragging) return;
            isDragging = false;
            icon.style.opacity = '1';

            // En yakın grid pozisyonunu bul
            const gridGap = 20;
            const iconWidth = 80;
            const iconHeight = 100;
            const desktopWidth = document.querySelector('.desktop-icons').clientWidth;
            const iconsPerRow = Math.floor((desktopWidth - gridGap) / (iconWidth + gridGap));

            const col = Math.round((icon.offsetLeft - gridGap) / (iconWidth + gridGap));
            const row = Math.round((icon.offsetTop - gridGap - 120) / (iconHeight + gridGap));

            // Pozisyonun dolu olup olmadığını kontrol et
            const newPos = row * iconsPerRow + col;
            const icons = document.querySelectorAll('.icon[data-app="webapp"]');
            const isPositionOccupied = Array.from(icons).some(
                otherIcon => otherIcon !== icon && otherIcon.dataset.gridPos === newPos.toString()
            );

            if (!isPositionOccupied && col >= 0 && row >= 0) {
                // Yeni pozisyonu ayarla
                const left = gridGap + (col * (iconWidth + gridGap));
                const top = gridGap + (row * (iconHeight + gridGap)) + 120;

                icon.style.left = `${left}px`;
                icon.style.top = `${top}px`;
                icon.dataset.gridPos = newPos;
            } else {
                // Eski pozisyonuna geri döndür
                icon.style.left = `${originalX}px`;
                icon.style.top = `${originalY}px`;
            }
        };
    }

    saveNewApp() {
        const title = document.getElementById('webapp-title').value.trim();
        let url = document.getElementById('webapp-url').value.trim();

        if (!title || !url) {
            alert('Lütfen başlık ve URL giriniz');
            return;
        }

        try {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }

            const newApp = {
                id: crypto.randomUUID(),
                title,
                url
            };

            this.apps.push(newApp);
            this.createAppIcon(newApp);
            this.hideCreator();
        } catch (error) {
            alert('Geçerli bir URL giriniz');
        }
    }

    initializeEvents() {
        document.querySelector('[data-app="webapps"]').onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showCreator();
        };

        document.getElementById('save-webapp').onclick = (e) => {
            e.preventDefault();
            this.saveNewApp();
        };

        document.getElementById('cancel-webapp').onclick = (e) => {
            e.preventDefault();
            this.hideCreator();
        };
    }

    showCreator() {
        const creator = document.querySelector('.webapp-creator');
        creator.classList.remove('hidden');
        document.getElementById('webapp-title').focus();
    }

    hideCreator() {
        const creator = document.querySelector('.webapp-creator');
        creator.classList.add('hidden');
        document.getElementById('webapp-title').value = '';
        document.getElementById('webapp-url').value = '';
    }
}

// Sağ tık menüsü oluştur
function createContextMenu() {
    const menu = document.createElement('div');
    menu.className = 'context-menu hidden';
    menu.innerHTML = `
        <div class="context-menu-item" data-action="delete">Sil</div>
    `;
    document.body.appendChild(menu);
    return menu;
}

// İkon sürükleme fonksiyonunu güncelle
function makeIconDraggable(icon) {
    let isDragging = false;
    let startX, startY;
    let originalX, originalY;

    // Sağ tık menüsü
    const contextMenu = createContextMenu();
    
    icon.oncontextmenu = (e) => {
        e.preventDefault();
        // Sistem ikonlarını silmeyi engelle
        if (!icon.dataset.app || icon.dataset.app === 'webapp') {
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;
            contextMenu.classList.remove('hidden');

            // Menü öğelerine tıklama olayları
            const deleteOption = contextMenu.querySelector('[data-action="delete"]');
            deleteOption.onclick = () => {
                icon.remove();
                // Web uygulamasını sadece memory'den sil
                if (icon.dataset.app === 'webapp') {
                    window.webAppManager.apps = window.webAppManager.apps.filter(
                        app => app.id !== icon.dataset.id
                    );
                }
                contextMenu.classList.add('hidden');
            };
        }
    };

    // Menü dışına tıklandığında kapat
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.classList.add('hidden');
        }
    });

    icon.style.position = 'absolute';
    
    // Başlangıç pozisyonunu ayarla
    if (!icon.dataset.gridPos) {
        const gridGap = 20;
        const iconWidth = 80;
        const iconHeight = 100;
        const index = Array.from(icon.parentElement.children).indexOf(icon);
        const row = Math.floor(index / 5);
        const col = index % 5;

        const left = gridGap + (col * (iconWidth + gridGap));
        const top = gridGap + (row * (iconHeight + gridGap));

        icon.style.left = `${left}px`;
        icon.style.top = `${top}px`;
        icon.dataset.gridPos = index;
    }

    icon.onmousedown = (e) => {
        if (e.button === 2) return; // Sağ tıklamada sürüklemeyi engelle
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        originalX = icon.offsetLeft;
        originalY = icon.offsetTop;
        icon.style.zIndex = '1000';
        icon.style.opacity = '0.7';
    };

    document.onmousemove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        icon.style.left = `${originalX + dx}px`;
        icon.style.top = `${originalY + dy}px`;
    };

    document.onmouseup = () => {
        if (!isDragging) return;
        isDragging = false;
        icon.style.opacity = '1';
        icon.style.zIndex = '1';

        // Pozisyonu kaydet
        if (icon.dataset.app) {
            const positions = JSON.parse(localStorage.getItem('iconPositions') || '{}');
            positions[icon.dataset.id || icon.dataset.app] = {
                left: icon.style.left,
                top: icon.style.top
            };
            localStorage.setItem('iconPositions', JSON.stringify(positions));
        }
    };
}

// Saat ve tarih güncelleme fonksiyonu
function updateDateTime() {
    const timeElement = document.querySelector('.time');
    const dateElement = document.querySelector('.date');
    const now = new Date();

    // Saat formatı: 14:05 gibi
    timeElement.textContent = now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Tarih formatı: 1 Ocak 2024 gibi
    dateElement.textContent = now.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Pil durumu güncelleme fonksiyonu
async function updateBattery() {
    const batteryIcon = document.querySelector('.battery i');
    const batteryLevel = document.querySelector('.battery-level');

    try {
        const battery = await navigator.getBattery();
        
        // Pil yüzdesini güncelle
        const level = Math.floor(battery.level * 100);
        batteryLevel.textContent = `${level}%`;

        // Pil ikonunu güncelle
        if (battery.charging) {
            batteryIcon.className = 'fas fa-bolt'; // Şarj oluyorsa
        } else {
            if (level > 75) {
                batteryIcon.className = 'fas fa-battery-full';
            } else if (level > 50) {
                batteryIcon.className = 'fas fa-battery-three-quarters';
            } else if (level > 25) {
                batteryIcon.className = 'fas fa-battery-half';
            } else if (level > 10) {
                batteryIcon.className = 'fas fa-battery-quarter';
            } else {
                batteryIcon.className = 'fas fa-battery-empty';
            }
        }

        // Pil durumu değişikliklerini dinle
        battery.addEventListener('levelchange', () => updateBattery());
        battery.addEventListener('chargingchange', () => updateBattery());
    } catch (error) {
        console.error('Pil bilgisi alınamadı:', error);
        batteryLevel.textContent = 'N/A';
        batteryIcon.className = 'fas fa-battery-full';
    }
}

// Sayfa yüklendiğinde sistemleri başlat
document.addEventListener('DOMContentLoaded', () => {
    window.windowManager = new WindowManager();
    window.webAppManager = new WebAppManager();

    // Tüm ikonları sürüklenebilir yap
    document.querySelectorAll('.icon').forEach(icon => {
        makeIconDraggable(icon);
    });

    // Sistem ikonlarına tıklama olaylarını ekle
    document.querySelectorAll('.icon').forEach(icon => {
        const appType = icon.dataset.app;
        if (!appType) return;

        if (appType === 'webapps') return; // Web uygulamaları ikonu için eventi WebAppManager yönetiyor

        icon.onclick = () => {
            switch(appType) {
                case 'documents':
                    window.windowManager.createWindow('Belgelerim', `
                        <div style="padding: 20px;">
                            <h3>Belgelerim</h3>
                            <p>Henüz belge bulunmuyor.</p>
                        </div>
                    `);
                    break;

                case 'notepad':
                    window.windowManager.createWindow('Not Defteri', `
                        <textarea style="width: 100%; height: 100%; border: none; resize: none; padding: 10px;"></textarea>
                    `);
                    break;

                case 'settings':
                    window.windowManager.createWindow('Ayarlar', `
                        <div style="padding: 20px;">
                            <h3>Tema Ayarları</h3>
                            <button onclick="document.body.classList.toggle('dark-theme')">Tema Değiştir</button>
                        </div>
                    `);
                    break;

                case 'weather':
                    window.windowManager.createWindow('Hava Durumu', `
                        <div style="padding: 20px;">
                            <h3>Hava Durumu</h3>
                            <p>22°C - Güneşli</p>
                        </div>
                    `);
                    break;
            }
        };
    });

    // Saat ve pil durumunu başlat
    updateDateTime();
    updateBattery();

    // Saat ve tarihi her saniye güncelle
    setInterval(updateDateTime, 1000);
    // Pil durumunu her 30 saniyede bir güncelle
    setInterval(updateBattery, 30000);
}); 