// details.js - Quản lý Chi tiết (Bản chuẩn hóa & Ràng buộc sĩ số)

// --- 1. KHỞI TẠO DỮ LIỆU ---
let classes = JSON.parse(localStorage.getItem('classes')) || 
              JSON.parse(localStorage.getItem('doanPhiData')) || [];

const params = new URLSearchParams(window.location.search);
const classId = params.get('id');
let currentClass = classes[classId];
let excelDataTemp = []; 

document.addEventListener('DOMContentLoaded', () => {
    if (!currentClass) { window.location.href = 'index.html'; return; }
    
    // Vá dữ liệu nếu thiếu cấu trúc
    if (!currentClass.tasks) currentClass.tasks = ["Sổ đoàn", "Lệ phí", "Học tập"];
    if (!currentClass.students) currentClass.students = [];
    
    currentClass.students.forEach(s => {
        if (!s.checkpoints) s.checkpoints = new Array(currentClass.tasks.length).fill(false);
    });

    renderStudentTable();
});

// --- 2. HÀM THỐNG KÊ (Đồng bộ với trang tổng) ---
function updateStatsInfo() {
    if (!currentClass) return;

    // Lấy số lượng đoàn viên thực tế trong danh sách
    const actualTotal = currentClass.students.length;
    // Lấy sĩ số tối đa đã thiết lập ở trang tổng
    const capacity = parseInt(currentClass.members) || actualTotal;

    // Tính số người hoàn thành (Tích tất cả các ô)
    const completedCount = currentClass.students.filter(s => 
        s.checkpoints && s.checkpoints.every(v => v === true)
    ).length;

    // Tính số người chưa hoàn thành dựa trên thực tế
    const pendingCount = actualTotal - completedCount;

    // Hiển thị ra giao diện
    if (document.getElementById('display-class-name')) document.getElementById('display-class-name').innerText = currentClass.name;
    if (document.getElementById('display-total')) document.getElementById('display-total').innerText = actualTotal;
    if (document.getElementById('display-completed')) document.getElementById('display-completed').innerText = completedCount;
    if (document.getElementById('display-pending')) document.getElementById('display-pending').innerText = pendingCount >= 0 ? pendingCount : 0;

    // CẬP NHẬT ĐỒNG BỘ: Để trang chủ Dashboard nhảy số đúng
    currentClass.completed = completedCount;
}

// --- 3. XỬ LÝ EXCEL (Ràng buộc sĩ số & Tự động cập nhật) ---
function handleFileSelect(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        if (json.length === 0) return alert("File này trống Đức ơi!");

        // ĐIỀU KIỆN RÀNG BUỘC: So sánh số dòng trong file với sĩ số thiết lập
        const capacity = parseInt(currentClass.members);
        if (json.length !== capacity) {
            alert(`LỖI: File có ${json.length} người, không khớp với sĩ số lớp đã tạo là ${capacity}!\nVui lòng chỉnh sửa lại file đúng sĩ số.`);
            input.value = ""; // Reset file input
            return;
        }

        // Tìm cột tiêu đề thông minh
        const firstRow = json[0] || {};
        const nameKey = Object.keys(firstRow).find(k => k.includes("Tên") || k.includes("Đoàn viên"));
        if (!nameKey) return alert("File không đúng mẫu (Cần cột Họ và Tên)!");

        excelDataTemp = json;
        document.getElementById('excel-file-name').innerText = file.name;
        
        // Kích hoạt nút xác nhận ngay lập tức
        const btn = document.getElementById('btn-import-confirm');
        if (btn) {
            btn.disabled = false;
            btn.classList.replace('bg-gray-300', 'bg-green-600');
        }
    };
    reader.readAsArrayBuffer(file);
}

function processExcel() {
    if (excelDataTemp.length === 0) return;

    const firstRow = excelDataTemp[0];
    const nameKey = Object.keys(firstRow).find(k => k.includes("Tên") || k.includes("Đoàn viên"));
    const msvKey = Object.keys(firstRow).find(k => k.includes("Mã") || k.includes("MSV") || k.includes("MSSV"));

    const news = excelDataTemp.map(r => ({
        name: String(r[nameKey] || "").trim(),
        msv: msvKey ? String(r[msvKey] || "").trim() : "",
        checkpoints: new Array(currentClass.tasks.length).fill(false)
    }));

    // Ghi đè danh sách sinh viên để khớp chính xác sĩ số file Excel
    currentClass.students = news;
    
    // Lưu và vẽ lại bảng ngay lập tức
    saveAndRefresh();
    closeMemberModal();
    alert(`Đã nhập thành công ${news.length} đoàn viên!`);
    excelDataTemp = []; 
}

// --- 4. LƯU TRỮ VÀ VẼ BẢNG ---
// details.js

function saveAndRefresh() {
    if (!currentClass) return;

    // QUAN TRỌNG: Cập nhật sĩ số (members) bằng đúng số lượng đoàn viên thực tế
    // Điều này giúp trang tổng nhảy số ngay lập tức dù Đức mới thêm 1 hay 2 người.
    currentClass.members = currentClass.students.length;

    // Tính toán số người hoàn thành
    const completedCount = currentClass.students.filter(s => 
        s.checkpoints && s.checkpoints.every(v => v === true)
    ).length;
    currentClass.completed = completedCount;

    // Ghi đè đối tượng đã sửa vào mảng classes tổng
    classes[classId] = currentClass;
    
    // Lưu vào localStorage
    localStorage.setItem('classes', JSON.stringify(classes));
    localStorage.setItem('doanPhiData', JSON.stringify(classes)); 
    
    // Vẽ lại giao diện tại chỗ
    renderStudentTable();
    updateStatsInfo();
}

// details.js

function renderStudentTable() {
    if (!currentClass) return;
    const body = document.getElementById('student-list-body');
    const header = document.getElementById('table-header');
    if (!body || !header) return;

    const tasks = currentClass.tasks || [];
    const searchInput = document.getElementById('search-student');
    const search = searchInput ? searchInput.value.toLowerCase() : "";

    // Lọc danh sách đoàn viên theo ô tìm kiếm
    const filtered = currentClass.students.filter(s => 
        s.name.toLowerCase().includes(search) || (s.msv && s.msv.toLowerCase().includes(search))
    );

    // 1. VẼ TIÊU ĐỀ BẢNG (Thêm cột Trạng thái)
    header.innerHTML = `
        <th class="p-5 w-10 text-center border-b">
            <input type="checkbox" id="select-all-checkbox" onchange="toggleAllStudents(this)" class="w-4 h-4 rounded accent-purple-600 cursor-pointer">
        </th>
        <th class="p-5 w-16 text-center border-b">STT</th>
        <th class="p-5 min-w-[200px] border-b">Họ và Tên Đoàn viên</th>
        <th class="p-5 text-center border-b text-blue-600">Tiến độ</th>
        <th class="p-5 text-center border-b">Trạng thái</th> ${tasks.map(t => `<th class="p-5 text-center border-b">${t}</th>`).join('')}
        <th class="p-5 text-right border-b">Thao tác</th>
    `;

    if (filtered.length === 0) {
        // Cập nhật colspan lên +6 vì có thêm cột mới
        body.innerHTML = `<tr><td colspan="${tasks.length + 6}" class="p-10 text-center text-gray-300 italic">Trống</td></tr>`;
    } else {
        body.innerHTML = filtered.map((student, sIdx) => {
            const originalIdx = currentClass.students.indexOf(student);
            const done = student.checkpoints.filter(v => v === true).length;
            const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
            
            // LẤY TRẠNG THÁI TỪ FILE status-config.js
            const tier = getStatusTier(progress);

            // Đảm bảo không lỗi nếu chưa khai báo mảng chọn
            const isSelected = (typeof selectedStudentIndices !== 'undefined') && selectedStudentIndices.includes(originalIdx);

            return `
                <tr class="hover:bg-gray-50/50 group border-b border-gray-50">
                    <td class="p-5 text-center">
                        <input type="checkbox" class="student-checkbox w-4 h-4 rounded accent-purple-600 cursor-pointer"
                               ${isSelected ? 'checked' : ''}
                               onchange="toggleStudentSelection(${originalIdx})">
                    </td>
                    <td class="p-5 text-center text-xs font-bold text-gray-400">${sIdx + 1}</td>
                    <td class="p-5 font-bold text-gray-800 uppercase text-sm">${student.name}</td>
                    
                    <td class="p-5 text-center font-black text-xs ${tier.color}">${progress}%</td>

                    <td class="p-5 text-center">
                        <span class="px-2 py-1 rounded-lg ${tier.bg} ${tier.color} ${tier.border} border text-[9px] font-black uppercase tracking-tighter">
                            ${tier.label}
                        </span>
                    </td>

                    ${tasks.map((_, tIdx) => `
                        <td class="p-5 text-center">
                            <input type="checkbox" ${student.checkpoints[tIdx] ? 'checked' : ''} 
                                   onchange="toggleTask(${originalIdx}, ${tIdx})" 
                                   class="w-5 h-5 accent-red-600 cursor-pointer">
                        </td>
                    `).join('')}
                    <td class="p-5 text-right">
                        <button onclick="deleteMember(${originalIdx})" class="text-red-400 p-2"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
        }).join('');
    }
    updateStatsInfo(); 
}
// --- 5. CÁC HÀM CÒN LẠI ---
function saveStudent() {
    const name = document.getElementById('student-name').value.trim();
    const msv = document.getElementById('student-msv').value.trim();
    const editIdx = document.getElementById('edit-student-index').value;
    if (!name) return alert("Nhập tên đoàn viên!");

    if (editIdx === "") {
        if (currentClass.students.length >= parseInt(currentClass.members)) {
            currentClass.members = currentClass.students.length + 1;
        }
        currentClass.students.push({ name, msv, checkpoints: new Array(currentClass.tasks.length).fill(false) });
    } else {
        currentClass.students[editIdx].name = name;
        currentClass.students[editIdx].msv = msv;
    }
    saveAndRefresh(); closeMemberModal();
}

function toggleTask(sIdx, tIdx) {
    currentClass.students[sIdx].checkpoints[tIdx] = !currentClass.students[sIdx].checkpoints[tIdx];
    saveAndRefresh();
}

function deleteMember(idx) {
    if(confirm("Xác nhận xóa?")) { currentClass.students.splice(idx, 1); saveAndRefresh(); }
}

function openMemberModal() { document.getElementById('member-modal').classList.replace('hidden', 'flex'); }
function closeMemberModal() { document.getElementById('member-modal').classList.replace('flex', 'hidden'); }
// details.js

function exportStudentReport() {
    // 1. Kiểm tra dữ liệu đầu vào
    if (!currentClass || !currentClass.students || currentClass.students.length === 0) {
        return alert("Đức ơi, lớp này chưa có đoàn viên nào để xuất báo cáo!");
    }

    try {
        // 2. Lấy thời gian hiện tại để ghi vào báo cáo
        const now = new Date();
        const timeStr = now.toLocaleString('vi-VN'); 

        // 3. Chuẩn bị tiêu đề và mảng dữ liệu
        const reportData = [
            ["BÁO CÁO TIẾN ĐỘ HOÀN THÀNH NHIỆM VỤ"],
            ["Chi đoàn: " + currentClass.name.toUpperCase()],
            ["Thời gian xuất: " + timeStr],
            [""], // Dòng trống
            ["STT", "Họ và Tên", "Mã Sinh Viên", "Tiến độ (%)", "Trạng thái"]
        ];

        // 4. Đổ dữ liệu đoàn viên vào mảng
        currentClass.students.forEach((s, i) => {
            const totalTasks = currentClass.tasks.length;
            const completedTasks = (s.checkpoints || []).filter(v => v === true).length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            // CHỈ THAY THẾ DÒNG NÀY ĐỂ GỌI TỪ FILE MỚI
            const tier = getStatusTier(progress);
            
            reportData.push([
                i + 1, 
                s.name, 
                s.msv || "---", 
                progress + "%", 
                tier.label // Cập nhật tên trạng thái từ file config
            ]);
        });

        // 5. Sử dụng thư viện XLSX để tạo file
        const worksheet = XLSX.utils.aoa_to_sheet(reportData);
        
        // Chỉnh độ rộng các cột cho đẹp (Cột Họ tên rộng ra)
        worksheet['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 20 }];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo");
        
        // 6. Tải file về máy
        const fileName = `Bao_cao_tien_do_${currentClass.name.replace(/\s+/g, '_')}.xlsx`;
        XLSX.writeFile(workbook, fileName);

    } catch (error) {
        console.error("Lỗi xuất file:", error);
        alert("Có lỗi xảy ra khi tạo file Excel. Đức kiểm tra lại thư viện SheetJS nhé!");
    }
}
// details.js

function saveAndRefresh() {
    // Lưu toàn bộ danh sách lớp vào máy
    localStorage.setItem('classes', JSON.stringify(classes));
    // Vẽ lại bảng ngay lập tức để thấy thay đổi
    renderStudentTable();
}