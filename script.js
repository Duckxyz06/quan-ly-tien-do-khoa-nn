// 1. DỮ LIỆU GỐC KHỞI TẠO (Cấu trúc chuẩn mới)
const initialData = [
    { 
        name: "K44A - CLC", 
        members: 35, 
        completed: 0, 
        note: "Khối 44",
        tasks: ["Sổ đoàn", "Lệ phí", "Học tập"], // Nhiệm vụ mặc định
        students: [] 
    },
    { 
        name: "K44B - CLC", 
        members: 32, 
        completed: 0, 
        note: "Khối 44",
        tasks: ["Sổ đoàn", "Lệ phí", "Học tập"],
        students: [] 
    }
];

// 2. KHỞI TẠO DỮ LIỆU TỪ LOCALSTORAGE
let classes = JSON.parse(localStorage.getItem('classes')) || initialData;

// Tự động kiểm tra và "vá" dữ liệu nếu thiếu cấu trúc Nhiệm vụ/Đoàn viên
classes = classes.map(item => ({
    ...item,
    tasks: item.tasks || ["Sổ đoàn", "Lệ phí", "Học tập"],
    students: item.students || [],
    completed: item.completed || 0
}));

// 3. HÀM HIỂN THỊ DANH SÁCH CHI ĐOÀN (Dashboard)
function renderClasses() {
    const container = document.getElementById('list-chi-doan');
    if (!container) return;

    const search = document.getElementById('search-input').value.toLowerCase();
    const filtered = classes.filter(c => c.name.toLowerCase().includes(search));
    const editActive = (typeof isEditMode !== 'undefined') && isEditMode;

    container.innerHTML = filtered.map((item) => {
        const realIndex = classes.indexOf(item);
        const isSelected = (typeof selectedIndices !== 'undefined') && selectedIndices.has(realIndex);
        
        // --- TÍNH LẠI TIẾN ĐỘ THỰC TẾ (TÍNH THEO TỪNG Ô TÍCH) ---
        let totalPossibleTicks = 0;
        let totalActualTicks = 0;

        if (item.students && item.tasks) {
            totalPossibleTicks = item.students.length * item.tasks.length;
            item.students.forEach(s => {
                totalActualTicks += (s.checkpoints || []).filter(v => v === true).length;
            });
        }

        // Tính % dựa trên tổng số ô tích thay vì số người hoàn thành 100%
        const percent = totalPossibleTicks > 0 ? Math.round((totalActualTicks / totalPossibleTicks) * 100) : 0;
        
        // GỌI LOGIC TỪ FILE RỜI
        const tier = getStatusTier(percent);

        return `
            <div onclick="${editActive ? `toggleSelectClass(${realIndex})` : `goToDetails(${realIndex})`}" 
                  class="bg-white p-5 rounded-2xl shadow-sm border-2 group hover:shadow-xl transition-all relative overflow-hidden cursor-pointer
                  ${isSelected ? 'border-red-500 bg-red-50/30' : 'border-gray-100 hover:border-red-100'}">
                
                ${editActive ? `
                <div class="absolute top-4 right-4 z-10">
                    <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all 
                          ${isSelected ? 'bg-red-600 border-red-600' : 'border-gray-300 bg-white shadow-inner'}">
                        ${isSelected ? '<i class="fas fa-check text-white text-[10px]"></i>' : ''}
                    </div>
                </div>
                ` : ''}

                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-bold text-gray-800 group-hover:text-red-600 transition-colors uppercase tracking-tight">${item.name}</h3>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">${item.members} ĐOÀN VIÊN</p>
                    </div>
                    
                    <div class="flex gap-1 ${editActive ? 'hidden' : 'opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0'}">
                        <button onclick="event.stopPropagation(); editClass(${realIndex})" class="bg-blue-50 text-blue-600 w-8 h-8 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                            <i class="fas fa-edit text-[10px]"></i>
                        </button>
                        <button onclick="event.stopPropagation(); openDeleteModal(${realIndex})" class="bg-red-50 text-red-600 w-8 h-8 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                            <i class="fas fa-trash text-[10px]"></i>
                        </button>
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                        <span>Tiến độ chi đoàn</span>
                        <span class="${tier.color}">${percent}%</span>
                    </div>
                    <div class="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                        <div class="${tier.color.replace('text', 'bg')} h-full transition-all duration-500" style="width: ${percent}%"></div>
                    </div>

                    <div class="pt-1">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl ${tier.bg} ${tier.border} border ${tier.color} text-[8px] font-black uppercase tracking-widest shadow-sm">
                            <i class="fas ${tier.icon} text-[7px]"></i>
                            ${tier.label}
                        </span>
                    </div>

                    <div class="pt-2 flex justify-between items-center border-t border-gray-50">
                        <span class="text-[9px] font-bold text-gray-400 uppercase">
                            ${item.completed}/${item.members} HOÀN THÀNH
                        </span>
                        <span class="text-[9px] font-bold text-red-500 uppercase group-hover:underline">
                            ${editActive ? 'Nhấp để chọn' : 'Chi tiết <i class="fas fa-arrow-right ml-1"></i>'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (typeof updateStats === 'function') updateStats();
    if (typeof saveData === 'function') saveData();
}
// 4. HÀM CẬP NHẬT THỐNG KÊ TỔNG (DASHBOARD TRANG CHỦ)
// script.js

function updateStats() {
    // 1. Khai báo các biến đếm theo từng ô tích (checkpoint)
    let totalAllPossibleTicks = 0; // Tổng số ô tích tối đa của cả Liên chi đoàn
    let totalAllActualTicks = 0;   // Tổng số ô thực tế đã được tích
    let totalMembers = 0;          // Tổng số đoàn viên
    const totalUnits = classes.length;

    // 2. Duyệt qua từng lớp để cộng dồn dữ liệu
    classes.forEach(c => {
        const students = c.students || [];
        const tasks = c.tasks || [];
        
        // Cộng dồn tổng sĩ số
        totalMembers += students.length;
        
        // Tính số ô tích tối đa của lớp này (Sĩ số x Số nhiệm vụ)
        totalAllPossibleTicks += students.length * tasks.length;

        // Đếm số ô đã tích thực tế trong lớp này
        students.forEach(s => {
            const ticks = (s.checkpoints || []).filter(v => v === true).length;
            totalAllActualTicks += ticks;
        });
    });

    // 3. Tính % tổng thể dựa trên tổng số dấu tích
    const overallPercent = totalAllPossibleTicks > 0 
        ? Math.round((totalAllActualTicks / totalAllPossibleTicks) * 100) : 0;

    // 4. Cập nhật lên giao diện Dashboard của Đức
    const membersEl = document.getElementById('stat-total-members');
    const unitsEl = document.getElementById('stat-total-units');
    const percentEl = document.getElementById('stat-percent');
    const progressBarEl = document.getElementById('stat-progress-bar');

    if (membersEl) membersEl.innerText = totalMembers;
    if (unitsEl) unitsEl.innerText = totalUnits;
    if (percentEl) percentEl.innerText = overallPercent + "%";
    if (progressBarEl) progressBarEl.style.width = overallPercent + "%";
}
// 5. CÁC HÀM ĐIỀU HƯỚNG VÀ LƯU TRỮ
function goToDetails(index) {
    window.location.href = `details.html?id=${index}`;
}

function saveData() {
    localStorage.setItem('classes', JSON.stringify(classes));
}

// --- QUẢN LÝ MODAL THÔNG TIN CHI ĐOÀN (THÊM & SỬA) ---

// 1. Mở Modal để Thêm mới
function openModal() {
    resetClassForm(); // Làm sạch ô nhập
    document.getElementById('class-modal-title').innerText = "Thêm Chi đoàn mới";
    // Đổi ID từ modal-form sang class-modal
    document.getElementById('class-modal').classList.replace('hidden', 'flex');
}

// 2. Mở Modal để Chỉnh sửa (Điền sẵn dữ liệu cũ)
function editClass(index) {
    resetClassForm();
    const c = classes[index];
    document.getElementById('class-modal-title').innerText = "Chỉnh sửa Chi đoàn";
    document.getElementById('edit-index').value = index; // Lưu vị trí lớp đang sửa
    document.getElementById('class-name').value = c.name;
    document.getElementById('class-members').value = c.members;
    document.getElementById('class-note').value = c.note || "";
    
    document.getElementById('class-modal').classList.replace('hidden', 'flex');
}

// 3. Đóng Modal
function closeClassModal() {
    document.getElementById('class-modal').classList.replace('flex', 'hidden');
}

// 4. Reset Form (Xóa dữ liệu cũ trong các ô nhập)
function resetClassForm() {
    document.getElementById('edit-index').value = "";
    document.getElementById('class-name').value = "";
    document.getElementById('class-members').value = "";
    document.getElementById('class-note').value = "";
}

// 5. Lưu dữ liệu (Hợp nhất Thêm & Sửa)
function saveClass() {
    const name = document.getElementById('class-name').value.trim();
    const members = document.getElementById('class-members').value;
    const note = document.getElementById('class-note').value.trim();
    const index = document.getElementById('edit-index').value;

    if (!name || !members) return alert("Đức ơi, đừng để trống Tên lớp và Sĩ số nhé!");

    if (index === "") {
        // TRƯỜNG HỢP THÊM MỚI: Đẩy lên đầu danh sách
        classes.unshift({ 
            name, 
            members: parseInt(members), 
            note, 
            completed: 0, 
            students: [], 
            tasks: ["Sổ đoàn", "Lệ phí", "Học tập"] 
        });
    } else {
        // TRƯỜNG HỢP CHỈNH SỬA: Cập nhật theo index
        classes[index].name = name;
        classes[index].members = parseInt(members);
        classes[index].note = note;
    }

    saveData(); // Lưu vào máy
    closeClassModal(); // Đóng bảng
    renderClasses(); // Vẽ lại danh sách lớp
}

// --- QUẢN LÝ MODAL XÓA (THAY THẾ HÀM DELETE CŨ) ---

// 1. Hàm mở Modal và kích hoạt hiệu ứng rung
function openDeleteModal(target) {
    const modal = document.getElementById('delete-modal');
    const iconBox = document.getElementById('warning-icon-box');
    const msg = document.getElementById('delete-modal-msg');
    const confirmBtn = document.getElementById('confirm-delete-btn');

    if (!modal) return;

    // Hiện Modal với hiệu ứng Flex
    modal.classList.replace('hidden', 'flex');
    
    // Kích hoạt hiệu ứng rung icon (Shake)
    if(iconBox) {
        iconBox.classList.add('animate-shake');
        // Xóa lớp rung sau 600ms để lần sau nhấn lại nó vẫn rung tiếp
        setTimeout(() => iconBox.classList.remove('animate-shake'), 600);
    }

    // Thiết lập nội dung thông báo và sự kiện cho nút Xác nhận
    if (target === 'bulk') {
        msg.innerText = `Xác nhận xóa ${selectedIndices.length} chi đoàn đã chọn? Hành động này không thể hoàn tác đâu Đức ơi!`;
        confirmBtn.onclick = () => {
            // Lọc bỏ các lớp đã chọn
            classes = classes.filter((_, i) => !selectedIndices.includes(i));
            selectedIndices = [];
            if (isEditMode) toggleEditMode(); // Tắt chế độ Edit sau khi xóa xong
            finalizeAction();
        };
    } else {
        msg.innerText = `Xóa Chi đoàn ${classes[target].name}? Toàn bộ dữ liệu đoàn viên bên trong sẽ biến mất vĩnh viễn.`;
        confirmBtn.onclick = () => {
            classes.splice(target, 1); // Xóa 1 lớp
            finalizeAction();
        };
    }
}

// 2. Hàm đóng Modal
function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.replace('flex', 'hidden');
}

// 3. Hàm chốt hạ: Lưu dữ liệu và vẽ lại giao diện
function finalizeAction() {
    saveData(); // Lưu vào LocalStorage
    closeDeleteModal();
    renderClasses(); // Cập nhật lại danh sách trên màn hình
}

// --- ĐIỀU KHIỂN MODAL XÓA XỊN XÒ ---
function openDeleteModal(index) {
    const modal = document.getElementById('delete-modal');
    const iconBox = document.getElementById('warning-icon-box'); // Cái khung chứa icon tam giác
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const msg = document.getElementById('delete-modal-msg');

    if (!modal) return;

    // 1. Hiện Modal
    modal.classList.replace('hidden', 'flex');

    // 2. Kích hoạt hiệu ứng rung (Shake)
    if (iconBox) {
        iconBox.classList.add('animate-shake');
        setTimeout(() => iconBox.classList.remove('animate-shake'), 600);
    }

    // 3. Gán nội dung thông báo
    msg.innerText = `Xóa Chi đoàn ${classes[index].name}? Mọi dữ liệu đoàn viên sẽ bị mất vĩnh viễn đó tình yêu!`;

    // 4. Gán sự kiện cho nút Xác nhận
    confirmBtn.onclick = () => {
        classes.splice(index, 1); // Xóa lớp
        saveData(); // Lưu lại
        closeDeleteModal(); // Đóng Modal
        renderClasses(); // Vẽ lại giao diện
    };
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.replace('flex', 'hidden');

}

function exportExcel() {
    alert("Đang trích xuất dữ liệu " + classes.length + " đơn vị...");
}

// KHỞI CHẠY ỨNG DỤNG
renderClasses();
let tempClassData = []; // Lưu trữ dữ liệu tạm thời từ file

// 1. Mở/Đóng Modal
function openImportClassModal() {
    document.getElementById('import-class-modal').classList.replace('hidden', 'flex');
}

function closeImportClassModal() {
    document.getElementById('import-class-modal').classList.replace('flex', 'hidden');
    document.getElementById('class-excel-input').value = ""; // Clear file
    document.getElementById('class-file-name').innerText = "Nhấp để chọn file Excel";
    document.getElementById('confirm-import-class-btn').disabled = true;
    document.getElementById('confirm-import-class-btn').classList.replace('bg-green-600', 'bg-gray-200');
}

// 2. Đọc và kiểm tra file Excel
// script.js

function handleClassExcel(input) {
    const file = input.files[0];
    if (!file) return;

    document.getElementById('class-file-name').innerText = "Đã chọn: " + file.name;
    const reader = new FileReader();

    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Mảng tạm để lưu tất cả các lớp đọc được từ các Sheet
        let allClassData = [];

        // 1. DUYỆT TẤT CẢ CÁC SHEET TRONG FILE
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            // Chuyển dữ liệu Sheet về dạng JSON (lấy dòng đầu làm tiêu đề)
            const rows = XLSX.utils.sheet_to_json(worksheet);

            if (rows.length > 0) {
                // 2. NHẬN DIỆN CỘT THÔNG MINH
                const firstRow = rows[0];
                const nameKey = Object.keys(firstRow).find(k => k.includes("Tên") || k.includes("Đoàn viên"));
                const msvKey = Object.keys(firstRow).find(k => k.includes("Mã") || k.includes("MSV") || k.includes("MSSV"));

                // 3. TẠO DANH SÁCH SINH VIÊN TỪ CÁC DÒNG TRONG SHEET
                const students = rows.map(r => ({
                    name: String(r[nameKey] || "").trim(),
                    msv: msvKey ? String(r[msvKey] || "").trim() : "",
                    // Khởi tạo 3 ô tích mặc định (Sổ đoàn, Lệ phí, Học tập)
                    checkpoints: [false, false, false]
                }));

                // 4. ĐÓNG GÓI THÔNG TIN LỚP
                allClassData.push({
                    name: sheetName.trim(), // Lấy tên Sheet làm tên lớp (VD: ĐHANH24C)
                    members: students.length, // Sĩ số tự động bằng số lượng sinh viên trong sheet
                    note: "Nhập hàng loạt từ file Master",
                    completed: 0,
                    tasks: ["Sổ đoàn", "Lệ phí", "Học tập"], // 3 nhiệm vụ mặc định
                    students: students // Gắn danh sách sinh viên vào lớp luôn
                    
                });
            }
            
        });
        

        // 5. CẬP NHẬT TRẠNG THÁI NÚT XÁC NHẬN
        if (allClassData.length > 0) {
            tempClassData = allClassData; // Gán vào biến tạm để chờ nhấn nút Xác nhận nhập
            const btn = document.getElementById('confirm-import-class-btn');
            if (btn) {
                btn.disabled = false;
                btn.classList.replace('bg-gray-200', 'bg-green-600');
                btn.classList.replace('cursor-not-allowed', 'hover:bg-green-700');
                btn.classList.add('shadow-xl', 'shadow-green-100');
            }
            alert(`Thành công! Đã đọc được ${allClassData.length} chi đoàn với tổng số sinh viên tương ứng.`);
        }
    };
    reader.readAsArrayBuffer(file);
}

// 3. Thực hiện lưu vào hệ thống
function processImportClass() {
    if (tempClassData.length === 0) return;

    // Đẩy dữ liệu vào danh sách và lưu lại
    classes = [...tempClassData, ...classes];
    localStorage.setItem('classes', JSON.stringify(classes)); // Lưu vào máy
    
    renderClasses(); // Vẽ lại giao diện
    closeImportClassModal(); // Đóng bảng
    
    alert(`Đức đã nhập thành công ${tempClassData.length} lớp!`);
}
// --- HÀM TẢI FILE MẪU EXCEL CHO CHI ĐOÀN (TRANG TỔNG) ---
// script.js

function downloadClassTemplate() {
    // 1. Tạo Workbook mới
    const workbook = XLSX.utils.book_new();

    // 2. Định nghĩa dữ liệu mẫu cho từng lớp (khớp với file VD1 của Đức)
    const headers = ["Họ và Tên", "Mã Sinh Viên"];
    const dataLop1 = [
        headers,
        ["Nguyễn Việt Đức", "22001234"],
        ["Trần Văn Mẫu", "22005678"]
    ];
    
    const dataLop2 = [
        headers,
        ["Lê Thị Ví Dụ", "22009999"],
        ["Phạm Văn Test", "22000000"]
    ];

    // 3. Chuyển đổi dữ liệu thành các Sheet
    const sheet1 = XLSX.utils.aoa_to_sheet(dataLop1);
    const sheet2 = XLSX.utils.aoa_to_sheet(dataLop2);

    // 4. Định dạng độ rộng cột cho đẹp
    const cols = [{ wch: 25 }, { wch: 15 }];
    sheet1['!cols'] = cols;
    sheet2['!cols'] = cols;

    // 5. Thêm các Sheet vào Workbook với tên Sheet là tên lớp
    XLSX.utils.book_append_sheet(workbook, sheet1, "ĐHANH24C");
    XLSX.utils.book_append_sheet(workbook, sheet2, "ĐHANH24D");

    // 6. Tải file về máy
    XLSX.writeFile(workbook, "Mau_Nhap_Du_Lieu_Toan_Khoa.xlsx");
}
// script.js

// 1. Hàm tải dữ liệu về máy (Backup)
function backupData() {
    const data = localStorage.getItem('classes');
    if (!data || data === "[]") return alert("Chưa có dữ liệu nào để sao lưu Đức ơi!");
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Đặt tên file có ngày tháng để dễ quản lý
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `Backup_DoanPhi_${date}.json`;
    a.click();
    
    alert("Đã tải bản sao lưu về máy thành công!");
}

// 2. Hàm đọc file backup và ghi đè vào hệ thống (Restore)
function restoreData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (confirm("Cảnh báo: Dữ liệu hiện tại trên web sẽ bị thay thế hoàn toàn bằng file backup này. Đức có chắc chắn không?")) {
                localStorage.setItem('classes', JSON.stringify(importedData));
                alert("Khôi phục dữ liệu thành công! Trang web sẽ tự tải lại.");
                location.reload(); // Load lại trang để cập nhật số liệu mới
            }
        } catch (err) {
            alert("Lỗi: File backup không đúng định dạng JSON!");
        }
    };
    reader.readAsText(file);
}
// script.js

function openGlobalTaskModal() {
    document.getElementById('global-task-modal').classList.replace('hidden', 'flex');
    renderGlobalTaskList();
}

function closeGlobalTaskModal() {
    document.getElementById('global-task-modal').classList.replace('flex', 'hidden');
}

function renderGlobalTaskList() {
    const list = document.getElementById('global-task-list');
    // Lấy danh sách nhiệm vụ từ lớp đầu tiên làm mẫu (vì tất cả sẽ giống nhau)
    const currentTasks = classes.length > 0 ? (classes[0].tasks || []) : [];
    
    list.innerHTML = currentTasks.map((t, idx) => `
        <div class="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
            <span class="text-sm font-bold text-gray-700">${t}</span>
            <button onclick="deleteGlobalTask(${idx})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash-alt"></i></button>
        </div>
    `).join('');
}

function addGlobalTask() {
    const name = document.getElementById('new-global-task').value.trim();
    if (!name) return;

    // PHÂN PHÁT CHO TẤT CẢ CÁC LỚP
    classes.forEach(cls => {
        if (!cls.tasks) cls.tasks = [];
        cls.tasks.push(name);
        
        // Cập nhật mảng tích chọn cho từng đoàn viên trong lớp đó
        if (cls.students) {
            cls.students.forEach(s => {
                if (!s.checkpoints) s.checkpoints = [];
                s.checkpoints.push(false);
            });
        }
    });

    saveData();
    renderGlobalTaskList();
    document.getElementById('new-global-task').value = "";
    alert(`Đã thêm nhiệm vụ "${name}" cho toàn bộ hệ thống!`);
}

function deleteGlobalTask(idx) {
    if (!confirm("Xóa nhiệm vụ này sẽ xóa sạch dữ liệu hoàn thành của toàn khoa. Đức chắc chứ?")) return;

    classes.forEach(cls => {
        if (cls.tasks) cls.tasks.splice(idx, 1);
        if (cls.students) {
            cls.students.forEach(s => {
                if (s.checkpoints) s.checkpoints.splice(idx, 1);
            });
        }
    });

    saveData();
    renderGlobalTaskList();
}
// script.js

function exportTotalExcelReport() {
    if (!classes || classes.length === 0) {
        alert("Chưa có dữ liệu chi đoàn nào để xuất báo cáo!");
        return;
    }

    // 1. Khởi tạo một Workbook (Sổ làm việc) mới
    const workbook = XLSX.utils.book_new();
    const currentTime = new Date().toLocaleString('vi-VN');

    // 2. Duyệt qua từng chi đoàn trong hệ thống
    classes.forEach(c => {
        const tasks = c.tasks || [];
        
        // CẬP NHẬT: Thêm "Trạng thái" vào tiêu đề cột
        const headers = ["Họ và Tên Đoàn viên", ...tasks, "Tiến độ (%)", "Trạng thái", "Thời gian xuất"];
        
        // Chuẩn bị dữ liệu cho từng đoàn viên
        const studentData = c.students.map(s => {
            let row = {};
            row["Họ và Tên Đoàn viên"] = s.name;
            
            let doneCount = 0;
            tasks.forEach((task, tIdx) => {
                const isDone = s.checkpoints[tIdx];
                row[task] = isDone ? "X" : "";
                if (isDone) doneCount++;
            });
            
            // Tính toán tiến độ %
            const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
            
            // GỌI LOGIC TỪ TỆP status-logic.js ĐỂ ĐỒNG BỘ
            const tier = getStatusTier(progress);
            
            row["Tiến độ (%)"] = progress + "%";
            row["Trạng thái"] = tier.label; // THÊM CỘT TRẠNG THÁI CHỮ
            row["Thời gian xuất"] = currentTime;
            
            return row;
        });

        // 3. Tạo Worksheet cho chi đoàn này
        const worksheet = XLSX.utils.json_to_sheet(studentData, { header: headers });
        
        // Tối ưu độ rộng cột (Thêm độ rộng cho cột Trạng thái)
        worksheet['!cols'] = [
            { wch: 25 }, 
            ...tasks.map(() => ({ wch: 12 })), 
            { wch: 15 }, 
            { wch: 20 }, // Độ rộng cho cột Trạng thái
            { wch: 20 }
        ];

        // 4. Đưa Sheet vào Workbook
        const sheetName = c.name.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, "_");
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // 5. Xuất file Excel tổng hợp
    const fileName = `Bao_Cao_Chi_Tiet_LCD_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    alert("Đã xuất file báo cáo chi tiết cho tất cả " + classes.length + " lớp!");
}
