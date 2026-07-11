
        const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzq_AUX-Ep0NM10bP-Yol83ODOWVehBqsXLW5BxnqjG8QJQn5h81CbzAPx0J9s85V68zA/exec";
        
        let reportData = [];
        let currentExamTitle = "";
        let globalSettings = []; 
        let currentChart = null; 
        let gelisimChart = null; // Gelişim grafiğini tutacak değişken

        // 🛡️ BULUT TABANLI GÜVENLİK DOĞRULAMASI
        async function checkLogin() {
            const user = document.getElementById('sysUsername').value.trim();
            const pass = document.getElementById('sysPassword').value;
            const btn = document.getElementById('btnLogin');
            const err = document.getElementById('loginError');

            if(!user || !pass) { alert("Lütfen kullanıcı adı ve şifre giriniz."); return; }

            btn.innerText = "⏳ Kontrol Ediliyor...";
            btn.disabled = true;

            try {
                // Şifre kontrolü için Apps Script'e doğrudan güvenli POST isteği atıyoruz
                const response = await fetch(WEB_APP_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'login', username: user, password: pass })
                });
                
                // No-cors modunda değilsek yanıtı çözebiliriz. Eğer Apps Script'iniz no-cors dönüyorsa 
                // alternatif olarak doGet üzerinden de kontrol mekanizması kurabiliriz. Ancak en temizi normal POST yanıtıdır.
                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('loginOverlay').classList.add('hidden');
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('activeUser', result.name);
                    document.getElementById('userBadge').innerText = result.name;
                    loadSettings(); // Başarılı girişte ayarları yükle
                } else {
                    err.innerText = "⚠️ " + (result.message || "Hatalı giriş!");
                    err.classList.remove('hidden');
                    setTimeout(() => err.classList.add('hidden'), 3000);
                }
            } catch (e) {
                // Eğer CORS/Erişim kısıtlaması yaşanırsa korumayı yerel yedek moda geçiriyoruz (Geliştirme kolaylığı için)
                console.error("Bulut doğrulaması hatası:", e);
                // Canlı dağıtımda hata alırsanız burayı tamamen kapatabilirsiniz, şu an test için esneklik sağlar:
                if(user === "ahmet" && pass === "ahmet15") {
                    document.getElementById('loginOverlay').classList.add('hidden');
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('activeUser', "Ahmet Hoca (Yedek Mod)");
                    document.getElementById('userBadge').innerText = "Ahmet Hoca";
                    loadSettings();
                } else {
                    err.innerText = "⚠️ Sunucu bağlantı hatası veya geçersiz bilgi!";
                    err.classList.remove('hidden');
                }
            } finally {
                btn.innerText = "Sisteme Giriş Yap";
                btn.disabled = false;
            }
        }

        async function loadSettings() {
            try {
                const response = await fetch(WEB_APP_URL);
                globalSettings = await response.json();
                
                const examTypes = [...new Set(globalSettings.map(item => item['Sınav Türü']))];
                
                const typeSelect = document.getElementById('examType');
                typeSelect.innerHTML = '<option value="">Sınav Türü Seçin</option>';
                examTypes.forEach(type => {
                    typeSelect.innerHTML += `<option value="${type}">${type}</option>`;
                });
            } catch (error) {
                document.getElementById('examType').innerHTML = '<option value="">❌ Ayarlar Çekilemedi!</option>';
            }
        }

        window.onload = () => {
            if (sessionStorage.getItem('isLoggedIn') === 'true') {
                document.getElementById('loginOverlay').classList.add('hidden');
                document.getElementById('userBadge').innerText = sessionStorage.getItem('activeUser') || "Hoca";
                loadSettings();
            }
        };

        const subLessonsConfig = {
            'TYT': {
                'sosyal': [
                    { id: 'tarih', name: 'Tarih', count: 5 },
                    { id: 'cografya', name: 'Coğrafya', count: 5 },
                    { id: 'felsefe', name: 'Felsefe', count: 5 },
                    { id: 'din', name: 'Din Kül.', count: 5 }
                ],
                'fen': [
                    { id: 'fizik', name: 'Fizik', count: 7 },
                    { id: 'kimya', name: 'Kimya', count: 7 },
                    { id: 'biyoloji', name: 'Biyoloji', count: 6 }
                ]
            },
            'AYT': {
                'turkce': [
                    { id: 'edebiyat', name: 'Edebiyat', count: 24 },
                    { id: 'tarih1', name: 'Tarih-1', count: 10 },
                    { id: 'cografya1', name: 'Coğrafya-1', count: 6 }
                ],
                'sosyal': [
                    { id: 'tarih2', name: 'Tarih-2', count: 11 },
                    { id: 'cografya2', name: 'Coğrafya-2', count: 11 },
                    { id: 'felsefe_gr', name: 'Felsefe Gr.', count: 12 },
                    { id: 'din2', name: 'Din Kül.-2', count: 6 }
                ],
                'fen': [
                    { id: 'fizik2', name: 'Fizik', count: 14 },
                    { id: 'kimya2', name: 'Kimya', count: 13 },
                    { id: 'biyoloji2', name: 'Biyoloji', count: 13 }
                ]
            }
        };

        function filterOptics() {
            const selectedType = document.getElementById('examType').value;
            const opticSelect = document.getElementById('opticName');
            const analyzeBtn = document.getElementById('btnAnalyze');
            
            opticSelect.innerHTML = '<option value="">Optik Form Seçin</option>';
            if (!selectedType) { opticSelect.disabled = true; analyzeBtn.disabled = true; return; }

            const filteredOptics = globalSettings.filter(s => s['Sınav Türü'] === selectedType);
            filteredOptics.forEach(opt => {
                opticSelect.innerHTML += `<option value="${opt['Optik Adı']}">${opt['Optik Adı']}</option>`;
            });
            
            opticSelect.disabled = false;
            analyzeBtn.disabled = false;
        }

        function turkceKarakterOnar(text) {
            const map = { 'Ý': 'İ', 'Þ': 'Ş', 'Ð': 'Ğ', 'ý': 'ı', 'þ': 'ş', 'ð': 'ğ', 'Ä±': 'ı', 'Ä°': 'İ', 'ÄŸ': 'ğ', 'Äž': 'Ğ', 'ÅŸ': 'ş', 'Åž': 'Ş', 'Ã¶': 'ö', 'Ã–': 'Ö', 'Ã§': 'ç', 'Ã‡': 'Ç', 'Ã¼': 'ü', 'Ãœ': 'Ü' };
            return text.replace(/[ÝÞÐýþðÄ°ÄŸÄžÅŸÅžÃ¶Ã–Ã§Ã‡Ã¼Ãœ]|Ä±/g, match => map[match] || match);
        }

        function processFile() {
            const fileInput = document.getElementById('fileInput');
            const titleInput = document.getElementById('examTitle').value.trim();
            const selectedExamType = document.getElementById('examType').value;
            const selectedOptic = document.getElementById('opticName').value;

            if (!fileInput.files[0]) { alert('Lütfen .txt dosyasını seçin.'); return; }
            if (!selectedExamType || !selectedOptic) { alert('Lütfen Sınav Türü ve Optik Form seçin.'); return; }
            
            const ayar = globalSettings.find(s => s['Sınav Türü'] === selectedExamType && s['Optik Adı'] === selectedOptic);
            currentExamTitle = titleInput || fileInput.files[0].name.replace(".txt", "");
            document.getElementById('examTitle').value = currentExamTitle;

            const reader = new FileReader();
            reader.onload = function(e) {
                const lines = e.target.result.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim().length > 0);
                let studentsLines = [];
                let keyA = "", keyB = "";

                lines.forEach(line => {
                    const namePart = line.substring(ayar['Ad Başlangıç'] || 0, ayar['Ad Bitiş'] || 0).trim();
                    if (namePart.startsWith('CEVAP A')) { keyA = line; } 
                    else if (namePart.startsWith('CEVAP B')) { keyB = line; } 
                    else {
                        studentsLines.push({
                            numara: line.substring(ayar['Öğr No Başlangıç'] || 0, ayar['Öğr No Bitiş'] || 0).trim(),
                            name: turkceKarakterOnar(namePart), 
                            sınıf: turkceKarakterOnar(line.substring(ayar['Sınıf Başlangıç'] || 0, ayar['Sınıf Bitiş'] || 0).trim()),
                            telefon: line.substring(ayar['TC/Tel Başlangıç'] || 0, ayar['TC/Tel Bitiş'] || 0).trim(), 
                            kitapcik: line.substring(ayar['Kitapçık Başlangıç'] || 0, ayar['Kitapçık Bitiş'] || 0).trim().toUpperCase(),
                            fullLine: line 
                        });
                    }
                });

                const baseLessonsConfig = [
                    { id: 'turkce', name: 'Türkçe', start: ayar['Türkçe Başlangıç'], end: ayar['Türkçe Bitiş'] },
                    { id: 'sosyal', name: 'Sosyal', start: ayar['Sosyal Başlangıç'], end: ayar['Sosyal Bitiş'] },
                    { id: 'matematik', name: 'Matematik', start: ayar['Matematik Başlangıç'], end: ayar['Matematik Bitiş'] },
                    { id: 'fen', name: 'Fen Bilimleri', start: ayar['Fen Başlangıç'], end: ayar['Fen Bitiş'] },
                    { id: 'ingilizce', name: 'İngilizce', start: ayar['İngilizce Başlangıç'], end: ayar['İngilizce Bitiş'] }
                ].filter(l => l.start !== "" && l.end !== "" && !isNaN(l.start) && !isNaN(l.end) && parseInt(l.start) < parseInt(l.end));

                reportData = studentsLines.map(student => {
                    let activeKey = (student.kitapcik === 'B') ? keyB : keyA;
                    let r = { numara: student.numara, name: student.name, sınıf: student.sınıf, telefon: student.telefon, kitapcik: student.kitapcik, denemeAdi: currentExamTitle, optikAdi: selectedOptic, totalNet: 0, details: {} };
                    
                    baseLessonsConfig.forEach(l => {
                        const sStart = parseInt(l.start);
                        const sEnd = parseInt(l.end);
                        const maxSoru = sEnd - sStart;

                        const subKey = activeKey.substring(sStart, sEnd) || "".padEnd(maxSoru, " ");
                        const subAns = student.fullLine.substring(sStart, sEnd) || "".padEnd(maxSoru, " ");
                        const subs = (subLessonsConfig[selectedExamType] && subLessonsConfig[selectedExamType][l.id]);

                        if (subs) {
                            let currentOffset = 0;
                            subs.forEach(sub => {
                                let dogru = 0, yanlis = 0, bos = 0;
                                let formattedStudentAns = "";
                                const maxSoruSub = sub.count;
                                
                                const partKey = subKey.substring(currentOffset, currentOffset + maxSoruSub) || "".padEnd(maxSoruSub, " ");
                                const partAns = subAns.substring(currentOffset, currentOffset + maxSoruSub) || "".padEnd(maxSoruSub, " ");
                                
                                for(let i=0; i < maxSoruSub; i++) {
                                    const k = partKey[i] || ' ';
                                    const s = partAns[i] || ' ';
                                    if (s === 'X' || s === ' ' || s === '') {
                                        bos++; formattedStudentAns += '-';
                                    } else if (s === k) {
                                        dogru++; formattedStudentAns += s.toUpperCase();
                                    } else {
                                        yanlis++; formattedStudentAns += s.toLowerCase();
                                    }
                                }
                                //let net = dogru - (yanlis / 4);
                                let net = (selectedExamType === 'LGS') ? (dogru - (yanlis / 3)) : (dogru - (yanlis / 4));
                                r.details[sub.id] = { label: sub.name, dogru, yanlis, bos, net, max: maxSoruSub, subKey: partKey, formattedStudentAns };
                                r.totalNet += net;
                                currentOffset += maxSoruSub;
                            });
                        } else {
                            let dogru = 0, yanlis = 0, bos = 0;
                            let formattedStudentAns = ""; 

                            for(let i=0; i < maxSoru; i++) {
                                const k = subKey[i] || ' '; 
                                const s = subAns[i] || ' ';
                                if (s === 'X' || s === ' ' || s === '') {
                                    bos++; formattedStudentAns += '-'; 
                                } else if (s === k) {
                                    dogru++; formattedStudentAns += s.toUpperCase(); 
                                } else {
                                    yanlis++; formattedStudentAns += s.toLowerCase(); 
                                }
                            }
                            //let net = dogru - (yanlis / 4); 
                            let net = (selectedExamType === 'LGS') ? (dogru - (yanlis / 3)) : (dogru - (yanlis / 4));
                            let finalLabel = l.name;
                            if (selectedExamType === 'AYT' && l.id === 'matematik') finalLabel = 'AYT Mat';
                            r.details[l.id] = { label: finalLabel, dogru, yanlis, bos, net, max: maxSoru, subKey, formattedStudentAns };
                            r.totalNet += net; 
                        }
                    });
                    
                    if(selectedExamType === 'TYT') { r.puan = 100 + (r.totalNet * 3.333); } 
                    else if(selectedExamType === 'AYT') { r.puan = 100 + (r.totalNet * 3.5); }
                    else if (selectedExamType === 'LGS') { r.puan = 200 + (r.totalNet * 3.1); } 
                    else { r.puan = r.totalNet * 3.5; }
                    
                    if (r.puan > 500) r.puan = 500;
                    return r;
                });

                renderUI();
            };
            reader.readAsText(fileInput.files[0], 'Windows-1254');
        }

        function renderUI() {
            reportData.sort((a, b) => b.puan - a.puan);
            const tbody = document.getElementById('resultTableBody');
            tbody.innerHTML = '';
            
            reportData.forEach((s, idx) => {
                s.sira = idx + 1;
                tbody.innerHTML += `
                    <tr class="hover:bg-indigo-50 transition-colors">
                        <td class="py-2.5 px-3 font-semibold text-slate-600">${s.sira}</td>
                        <td class="py-2.5 px-3 font-mono text-slate-500">${s.numara || '-'}</td>
                        <td class="py-2.5 px-3 font-medium text-slate-800">${s.name}</td>
                        <td class="py-2.5 px-2 text-center text-slate-600">${s.sınıf || '-'}</td>
                        <td class="py-2.5 px-3 text-center font-bold text-indigo-600 bg-indigo-50/50">${s.totalNet.toFixed(2)}</td>
                        <td class="py-2.5 px-3 text-center font-black text-emerald-600 bg-emerald-50/50">${s.puan.toFixed(1)}</td>
                        <td class="py-2.5 px-3 text-center">
                            <button onclick="showKarne(${idx})" class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors">📊 Karne</button>
                            <button onclick="showGelisim('${s.numara}', '${s.name}')" class="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors ml-1">📈 Gelişim</button>
                        </td>
                    </tr>`;
            });
            document.getElementById('actionButtons').classList.remove('hidden');
        }

        function showKarne(idx) {
            const student = reportData[idx];
            if (!student) return;

            document.getElementById("karneOgrenciAdi").innerText = `${student.name} (${student.numara})`;
            document.getElementById("karneSiralama").innerText = `Sınıf: ${student.sınıf} | Genel Sıralama: ${student.sira} | Puan: ${student.puan.toFixed(1)}`;
            
            const ctx = document.getElementById('karneGrafik').getContext('2d');
            if (currentChart) currentChart.destroy(); 

            const labels = [], dataDogru = [], dataYanlis = [], dataNet = [];
            Object.keys(student.details).forEach(key => {
                const d = student.details[key];
                labels.push(d.label);
                dataDogru.push(d.dogru);
                dataYanlis.push(d.yanlis);
                dataNet.push(d.net);
            });

            currentChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Doğru', data: dataDogru, backgroundColor: '#10b981', borderRadius: 4 },
                        { label: 'Yanlış', data: dataYanlis, backgroundColor: '#ef4444', borderRadius: 4 },
                        { label: 'Net', data: dataNet, backgroundColor: '#6366f1', borderRadius: 4 }
                    ]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } }
            });
            document.getElementById("karneModal").classList.remove('hidden');
        }

        // 📈 ÖĞRENCİ GELİŞİM GEÇMİŞİNİ BULUTTAN ÇEKEN FONKSİYON        
        // 🔍 HIZLI ARAMA BUTONUNUN TETİKLEYİCİSİ (YENİ EKLENDİ)
        // --- YENİ: ÖĞRENCİ REHBERİ YÖNETİMİ ---
        let allStudentsList = []; // Google'dan gelen listeyi hafızada tutar
        
        async function fetchStudentList() {
            const type = document.getElementById('quickExamType').value;
            const container = document.getElementById('studentListContainer');
            const loading = document.getElementById('studentListLoading');
            
            container.innerHTML = '';
            loading.classList.remove('hidden');
        
            try {
                const res = await fetch(WEB_APP_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'getStudentList', secilenTur: type })
                });
                const result = await res.json();
                
                if(result.success) {
                    allStudentsList = result.data;
                    renderStudentList(allStudentsList);
                }
            } catch(e) {
                container.innerHTML = '<div class="p-3 text-center text-xs text-red-500">Bağlantı hatası!</div>';
            } finally {
                loading.classList.add('hidden');
            }
        }
        
        function renderStudentList(list) {
            const container = document.getElementById('studentListContainer');
            if(list.length === 0) {
                container.innerHTML = '<div class="p-4 text-center text-xs text-slate-500">Bu sınav türünde kayıtlı öğrenci bulunamadı.</div>';
                return;
            }
            
            // Tıklanan öğrencinin bilgilerini doğrudan grafiğe gönderiyoruz
            container.innerHTML = list.map(s => `
                <div onclick="showGelisim('${s.numara}', '${s.isim}')" class="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors group">
                    <span class="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">${s.isim}</span>
                    <span class="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">${s.numara}</span>
                </div>
            `).join('');
        }
        
        function filterStudentList() {
            const query = document.getElementById('studentSearchInput').value.toLowerCase();
            const filtered = allStudentsList.filter(s => s.isim.toLowerCase().includes(query) || s.numara.includes(query));
            renderStudentList(filtered);
        }
        
        // Uygulama yüklendiğinde otomatik olarak listeyi getir
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => { if(document.getElementById('quickExamType')) fetchStudentList(); }, 1500);
        });
        
        // --- YENİ: BRANŞ DESTEKLİ VE LİMİTLİ GELİŞİM GRAFİĞİ ---
        async function showGelisim(ogrenciNo, ogrenciAdi, zorunluTur) {
            const modal = document.getElementById("gelisimModal");
            const loading = document.getElementById("gelisimLoading");
            const canvasContainer = document.getElementById("gelisimCanvasContainer");
            const baslik = document.getElementById("gelisimOgrenciAdi");
            
            const secilenSinav = zorunluTur || document.getElementById('quickExamType').value;
            const gosterilecekAdet = parseInt(document.getElementById('examLimit').value); // Kullanıcının seçtiği 5, 10 veya Tümü rakamı
        
            modal.classList.remove('hidden');
            loading.classList.remove('hidden');
            canvasContainer.classList.add('hidden');
            baslik.innerText = `${ogrenciAdi} (${ogrenciNo})`;
        
            try {
                const response = await fetch(WEB_APP_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'getStudentHistory', numara: ogrenciNo, secilenTur: secilenSinav })
                });
                const result = await response.json();
        
                if (result.success && result.data.length > 0) {
                    loading.classList.add('hidden');
                    canvasContainer.classList.remove('hidden');
                    
                    // Kullanıcının "Son 5", "Son 10" seçimine göre tablonun sonundan veriyi kesiyoruz
                    let analizVerisi = result.data;
                    if (gosterilecekAdet !== 999) {
                        analizVerisi = analizVerisi.slice(-gosterilecekAdet);
                    }
        
                    const labels = analizVerisi.map(d => d.denemeAdi);
                    const dataTotal = analizVerisi.map(d => d.net);
                    
                    // Branşları çekiyoruz
                    const dataTurkce = analizVerisi.map(d => d.branslar['Türkçe']);
                    const dataMat = analizVerisi.map(d => d.branslar['Matematik']);
                    const dataFen = analizVerisi.map(d => d.branslar['Fen B.']);
        
                    // Grafiğin Datasetlerini oluşturuyoruz
                    const datasets = [
                        {
                            label: 'Toplam Net', data: dataTotal,
                            borderColor: '#10b981', backgroundColor: '#10b981',
                            borderWidth: 4, tension: 0.3
                        },
                        {
                            label: 'Türkçe', data: dataTurkce,
                            borderColor: '#ef4444', backgroundColor: '#ef4444',
                            borderWidth: 2, tension: 0.3, hidden: true // Başlangıçta gizli
                        },
                        {
                            label: 'Matematik', data: dataMat,
                            borderColor: '#3b82f6', backgroundColor: '#3b82f6',
                            borderWidth: 2, tension: 0.3, hidden: true
                        },
                        {
                            label: 'Fen Bilimleri', data: dataFen,
                            borderColor: '#f59e0b', backgroundColor: '#f59e0b',
                            borderWidth: 2, tension: 0.3, hidden: true
                        }
                    ];
        
                    // Eğer Sınav YKS ise Sosyal bölümünü de ekle
                    if (secilenSinav === "YKS") {
                        const dataSos = analizVerisi.map(d => d.branslar['Sosyal']);
                        datasets.push({
                            label: 'Sosyal Bilgiler', data: dataSos,
                            borderColor: '#8b5cf6', backgroundColor: '#8b5cf6',
                            borderWidth: 2, tension: 0.3, hidden: true
                        });
                    }
        
                    const ctx = document.getElementById('gelisimGrafik').getContext('2d');
                    if (gelisimChart) gelisimChart.destroy();
        
                    gelisimChart = new Chart(ctx, {
                        type: 'line',
                        data: { labels: labels, datasets: datasets },
                        options: { 
                            responsive: true, 
                            scales: { y: { beginAtZero: false } },
                            plugins: { 
                                legend: { position: 'top' },
                                tooltip: { mode: 'index', intersect: false }
                            },
                            interaction: { mode: 'nearest', axis: 'x', intersect: false }
                        }
                    });
                } else {
                    loading.classList.add('hidden');
                    baslik.innerText = "Bu öğrencinin geçmiş kaydı bulunamadı.";
                }
            } catch (e) {
                console.error(e);
                loading.classList.add('hidden');
                baslik.innerText = "Bağlantı Hatası!";
            }
        }


        function printReport(type) {
            const printArea = document.getElementById('printArea');
            const printAreaListe = document.getElementById('printAreaListe');
            const printAreaKarneler = document.getElementById('printAreaKarneler');
            const pageStyle = document.getElementById('printPageStyle');
            
            printAreaListe.classList.add('hidden');
            printAreaKarneler.classList.add('hidden');
            printArea.classList.remove('hidden');

            if (type === 'liste') {
                pageStyle.innerHTML = '@media print { @page { size: landscape; margin: 8mm; } body { margin: 0; } }';
                let firstStudent = reportData[0];
                let lessonHeaders = ''; let subHeaders = '';
                
                if(firstStudent) {
                    Object.keys(firstStudent.details).forEach(key => {
                        lessonHeaders += `<th class="border border-slate-400 p-0.5 bg-slate-200" colspan="3">${firstStudent.details[key].label}</th>`;
                        subHeaders += `
                            <th class="border border-slate-400 p-0.5 text-emerald-700 bg-emerald-50 text-[9px] font-bold">D</th>
                            <th class="border border-slate-400 p-0.5 text-red-700 bg-red-50 text-[9px] font-bold">Y</th>
                            <th class="border border-slate-400 p-0.5 text-indigo-700 bg-indigo-50 text-[9px] font-bold">N</th>
                        `;
                    });
                }

                printAreaListe.innerHTML = `
                    <h2 class="text-base font-black mb-3 text-center uppercase">${currentExamTitle} - DETAYLI BRANŞ ANALİZ LİSTESİ</h2>
                    <table class="w-full text-[9px] text-center border-collapse border border-slate-400">
                        <thead>
                            <tr class="bg-slate-100 text-slate-800">
                                <th class="border border-slate-400 p-1" rowspan="2">Sıra</th>
                                <th class="border border-slate-400 p-1" rowspan="2">No</th>
                                <th class="border border-slate-400 p-1 text-left" rowspan="2">Ad Soyad</th>
                                <th class="border border-slate-400 p-1" rowspan="2">Sınıf</th>
                                ${lessonHeaders}
                                <th class="border border-slate-400 p-1 bg-indigo-100 font-bold" rowspan="2">T.Net</th>
                                <th class="border border-slate-400 p-1 bg-emerald-100 font-bold" rowspan="2">Puan</th>
                            </tr>
                            <tr class="bg-slate-50">${subHeaders}</tr>
                        </thead>
                        <tbody>
                            ${reportData.map(s => {
                                let studentLessonsHtml = '';
                                Object.keys(s.details).forEach(key => {
                                    let d = s.details[key];
                                    studentLessonsHtml += `
                                        <td class="border border-slate-400 p-0.5 text-emerald-700 font-semibold">${d.dogru}</td>
                                        <td class="border border-slate-400 p-0.5 text-red-700">${d.yanlis}</td>
                                        <td class="border border-slate-400 p-0.5 font-bold text-indigo-700">${d.net % 1 === 0 ? d.net : d.net.toFixed(2)}</td>
                                    `;
                                });
                                return `
                                <tr class="hover:bg-slate-50">
                                    <td class="border border-slate-400 p-0.5 font-bold">${s.sira}</td>
                                    <td class="border border-slate-400 p-0.5 font-mono">${s.numara||'-'}</td>
                                    <td class="border border-slate-400 p-0.5 text-left font-medium whitespace-nowrap">${s.name}</td>
                                    <td class="border border-slate-400 p-0.5">${s.sınıf||'-'}</td>
                                    ${studentLessonsHtml}
                                    <td class="border border-slate-400 p-0.5 font-black text-indigo-900 bg-indigo-50">${s.totalNet.toFixed(2)}</td>
                                    <td class="border border-slate-400 p-0.5 font-black text-emerald-900 bg-emerald-50">${s.puan.toFixed(1)}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>`;
                printAreaListe.classList.remove('hidden');
            } 
            else if (type === 'karne') {
                pageStyle.innerHTML = '@media print { @page { size: portrait; margin: 8mm; } body { margin: 0; } }';
                printAreaKarneler.innerHTML = '';
                
                reportData.forEach(s => {
                    let chartHtml = `<div class="flex flex-col mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div class="flex justify-around items-end h-28 border-b-2 border-l-2 border-slate-300 pb-2 pl-2 relative pt-4">`;
                    
                    Object.keys(s.details).forEach(key => {
                        const d = s.details[key];
                        const dogruH = Math.max(0, (d.dogru / d.max) * 100);
                        const yanlisH = Math.max(0, (d.yanlis / d.max) * 100);
                        const netH = Math.max(0, (d.net / d.max) * 100);
                        chartHtml += `
                            <div class="flex flex-col items-center gap-1 w-1/4 h-full justify-end">
                                <div class="flex items-end gap-0.5 w-full h-full justify-center">
                                    <div class="w-4 bg-emerald-500 rounded-t relative print-shadow-none" style="height: ${dogruH}%;"><span class="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-700">${d.dogru}</span></div>
                                    <div class="w-4 bg-red-500 rounded-t relative print-shadow-none" style="height: ${yanlisH}%;"><span class="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-700">${d.yanlis}</span></div>
                                    <div class="w-4 bg-indigo-500 rounded-t relative print-shadow-none" style="height: ${netH}%;"><span class="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-700">${d.net % 1 === 0 ? d.net : d.net.toFixed(1)}</span></div>
                                </div>
                                <span class="text-[9px] font-bold text-slate-600 mt-2 truncate w-full text-center">${d.label}</span>
                            </div>`;
                    });
                    chartHtml += `</div></div>`;

                    let lessonRowsHtml = '';
                    Object.keys(s.details).forEach(key => {
                        const d = s.details[key];
                        lessonRowsHtml += `
                            <div class="border border-slate-300 rounded p-1.5 mb-1 bg-white text-xs print-shadow-none">
                                <div class="bg-slate-50 border border-slate-200 p-1 rounded text-[9px] font-mono tracking-widest whitespace-nowrap">
                                    <div class="flex"><span class="w-16 font-semibold text-slate-500">${d.label.substring(0,4).toUpperCase()}:</span> <span class="text-slate-800">${d.subKey}</span></div>
                                    <div class="flex mt-0.5"><span class="w-16 font-semibold text-slate-500">ÖĞR:</span> <span class="text-slate-800 font-bold">${d.formattedStudentAns}</span></div>
                                </div>
                            </div>`;
                    });

                    printAreaKarneler.innerHTML += `
                        <div class="page-break max-w-3xl mx-auto p-6 my-4 bg-white border border-slate-400 rounded-2xl print-shadow-none">
                            <div class="text-center border-b border-slate-400 pb-2 mb-3">
                                <h2 class="text-xl font-black text-slate-900">${currentExamTitle} SONUÇ BELGESİ</h2>
                            </div>
                            <div class="grid grid-cols-4 gap-2 text-xs mb-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div><span class="text-slate-500 block text-[9px] uppercase font-bold">Öğrenci</span> <span class="font-bold block truncate">${s.numara} - ${s.name}</span></div>
                                <div><span class="text-slate-500 block text-[9px] uppercase font-bold">Sınıf</span> <span class="font-bold block">${s.sınıf || '-'}</span></div>
                                <div><span class="text-slate-500 block text-[9px] uppercase font-bold">Derece</span> <span class="font-black text-indigo-700 block">${s.sira} / ${reportData.length}</span></div>
                                <div><span class="text-slate-500 block text-[9px] uppercase font-bold">Puan</span> <span class="font-black text-emerald-600 block">${s.puan.toFixed(1)}</span></div>
                            </div>
                            ${chartHtml}
                            <div class="grid grid-cols-2 gap-2 mt-2">${lessonRowsHtml}</div>
                        </div>`;
                });
                printAreaKarneler.classList.remove('hidden');
            }
            setTimeout(() => { window.print(); printArea.classList.add('hidden'); }, 300);
        }

        // 💾 TÜM BRANŞ ANALİZLERİNİ BULUTA AKTARAN FONKSİYON
async function saveActiveExamToDB() {
    const btn = document.getElementById("btnSaveToDB");
    if (btn) btn.innerText = "⏳ Gönderiliyor...";
    
    // 🎯 YENİ: Arayüzde seçilen sınav türünü (TYT, AYT, LGS) çekiyoruz
    const secilenSinav = document.getElementById('examType').value;

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            // secilenTur adıyla Apps Script'e gönderiyoruz
            body: JSON.stringify({ action: 'saveExam', secilenTur: secilenSinav, students: reportData })
        });
        
        const textResult = await response.text(); 
        let result = { success: false };
        
        try {
            // Eğer gelen yanıt JSON ise çözümlüyoruz
            result = JSON.parse(textResult);
        } catch(e) {
            // Eğer düz metin geldiyse ve içinde "başarılı" veya "ok" gibi bir ibare geçiyorsa veya HTTP 200 ise başarılı sayıyoruz
            if (response.ok) {
                result = { success: true };
            }
        }
        if (result.success) {
            alert("✅ Başarılı! Tüm detaylı branş verileri buluta (Google Sheets) güvenle aktarıldı.");
        } else {
            alert("❌ Hata: " + (result.message || "Bilinmeyen bir hata oluştu."));
        }
    } catch (error) {
        console.error("Hata:", error);
        alert("⚠️ Veri aktarımı tetiklendi! Lütfen Google E-Tablonuzdaki sayfayı kontrol edin.");
    } finally {
        if (btn) btn.innerText = "💾 Buluta (Sheets) Kaydet";
    }
}
// --- GRAFİK YAZDIRMA FONKSİYONU ---
function printGelisimChart() {
    const canvas = document.getElementById('gelisimGrafik');
    if (!canvas) {
        alert("Yazdırılacak grafik bulunamadı!");
        return;
    }

    // 1. Grafiği yüksek kaliteli bir PNG resmine dönüştür
    const imgData = canvas.toDataURL('image/png', 1.0);
    const ogrenciAdi = document.getElementById("gelisimOgrenciAdi").innerText;

    // 2. Sadece yazdırma işlemi için geçici bir pencere aç
    const printWindow = window.open('', '_blank');

    // 3. Geçici pencerenin içine resmimizi ve basit bir tasarım ekle
    printWindow.document.write(`
        <html>
        <head>
            <title>${ogrenciAdi} - Gelişim Grafiği</title>
            <style>
                body { 
                    font-family: sans-serif; 
                    text-align: center; 
                    padding: 20px; 
                    color: #1e293b;
                }
                img { 
                    max-width: 100%; 
                    height: auto; 
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 10px;
                }
                h2 { margin-bottom: 20px; }
                /* Yazıcıya yatay (landscape) çıktı vermesini söyler */
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body { margin: 0; padding: 0; }
                }
            </style>
        </head>
        <body>
            <h2>${ogrenciAdi} - Deneme Analiz Grafiği</h2>
            <img src="${imgData}" />
            <script>
                // Resmin tam yüklenmesi için yarım saniye bekleyip yazdırma ekranını aç
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                        window.close(); // Yazdırma bitince geçici pencereyi kapat
                    }, 500);
                };
            <\/script>
        </body>
        </html>
    `);
    
    // Pencereyi yüklemeyi bitir
    printWindow.document.close();
}
