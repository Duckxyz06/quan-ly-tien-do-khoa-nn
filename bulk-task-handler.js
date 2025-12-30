// bulk-task-handler.js

let selectedStudentIndices = [];

// 1. CẬP NHẬT: Chọn hoặc bỏ chọn tất cả
function toggleAllStudents(master) {
    const checkboxes = document.querySelectorAll('.student-checkbox');
    selectedStudentIndices = [];
    
    if (master.checked) {
        checkboxes.forEach(cb => {
            // Lấy index từ data-index hoặc onchange
            const idx = parseInt(cb.dataset.index || cb.getAttribute('onchange').match(/\d+/)[0]);
            selectedStudentIndices.push(idx);
        });
    }

    // Cập nhật thanh đen và vẽ lại bảng để hiển thị dấu tích chuẩn xác
    updateBulkActionBar();
    renderStudentTable(); 
}

// 2. CẬP NHẬT: Chọn/Bỏ chọn từng người
function toggleStudentSelection(idx) {
    const position = selectedStudentIndices.indexOf(idx);
    
    if (position > -1) {
        // Nếu đã chọn rồi thì xóa khỏi mảng (Bỏ chọn)
        selectedStudentIndices.splice(position, 1);
    } else {
        // Nếu chưa chọn thì thêm vào mảng (Chọn)
        selectedStudentIndices.push(idx);
    }

    // Cập nhật trạng thái ô "Chọn tất cả" trên đầu bảng
    const master = document.getElementById('select-all-checkbox');
    if (master) {
        master.checked = selectedStudentIndices.length > 0 && 
                         selectedStudentIndices.length === document.querySelectorAll('.student-checkbox').length;
    }

    updateBulkActionBar();
    // Quan trọng: Vẽ lại bảng để dấu tích biến mất/hiện lên đúng ý Đức
    renderStudentTable(); 
}


// 3. CẬP NHẬT: Thêm nút Bỏ chọn vào thanh màu đen
function updateBulkActionBar() {
    const bar = document.getElementById('bulk-action-bar');
    const countLabel = document.getElementById('selected-count');
    const btnContainer = document.getElementById('bulk-task-buttons');
    
    if (selectedStudentIndices.length > 0) {
        bar.classList.replace('hidden', 'flex');
        countLabel.innerText = `${selectedStudentIndices.length} Đã chọn`;
        
        // Tạo các nút nhiệm vụ từ danh sách nhiệm vụ của lớp
        let buttonsHtml = currentClass.tasks.map((task, tIdx) => `
            <button onclick="applyBulkTask(${tIdx})" class="bg-purple-600 hover:bg-purple-700 text-[10px] font-bold px-4 py-2 rounded-xl transition-all uppercase whitespace-nowrap">
                Xong ${task}
            </button>
        `).join('');

        // THÊM NÚT "BỎ CHỌN" VÀO THANH ĐEN
        buttonsHtml += `
            <button onclick="clearSelection()" class="bg-gray-700 hover:bg-gray-600 text-[10px] font-bold px-4 py-2 rounded-xl transition-all uppercase whitespace-nowrap border border-gray-600 ml-2">
                <i class="fas fa-undo mr-1"></i> Bỏ chọn
            </button>
        `;
        
        btnContainer.innerHTML = buttonsHtml;
    } else {
        bar.classList.replace('flex', 'hidden');
    }
}

// 4. Áp dụng nhiệm vụ và dọn dẹp
function applyBulkTask(taskIdx) {
    selectedStudentIndices.forEach(sIdx => {
        if (currentClass.students[sIdx]) {
            currentClass.students[sIdx].checkpoints[taskIdx] = true;
        }
    });
    
    saveAndRefresh(); // Lưu vào localStorage và vẽ lại giao diện
    clearSelection(); // Xóa trạng thái chọn sau khi xong
}

// bulk-task-handler.js

function clearSelection() {
    // 1. Xóa sạch danh sách index đã chọn trong bộ nhớ
    selectedStudentIndices = [];
    
    // 2. Bỏ tích ô "Chọn tất cả" trên đầu bảng dữ liệu
    const masterCheckbox = document.getElementById('select-all-checkbox');
    if (masterCheckbox) masterCheckbox.checked = false;
    
    // 3. Ẩn thanh hành động màu đen
    updateBulkActionBar();
    
    // 4. QUAN TRỌNG NHẤT: Vẽ lại bảng để các ô tích biến mất ngay lập tức
    if (typeof renderStudentTable === 'function') {
        renderStudentTable(); 
    }
}
// bulk-task-handler.js

// 1. HÀM MỚI: Xóa sạch các dấu tick ở cột nhiệm vụ cho những người đã chọn
function resetTasksForSelected() {
    if (selectedStudentIndices.length === 0) return;
    
    if (!confirm(`Đức có chắc chắn muốn HỦY hoàn thành tất cả nhiệm vụ của ${selectedStudentIndices.length} người này?`)) return;

    selectedStudentIndices.forEach(idx => {
        const student = currentClass.students[idx];
        if (student && student.checkpoints) {
            // Đưa tất cả các ô tích về trạng thái chưa hoàn thành (false)
            student.checkpoints = student.checkpoints.map(() => false);
        }
    });

    // Lưu dữ liệu và vẽ lại bảng để cập nhật màu sắc/tiến độ
    saveAndRefresh(); 
    alert("Đã xóa các dấu tích nhiệm vụ thành công!");
}

// 2. Cập nhật giao diện thanh đen để có nút "Hủy nhiệm vụ"
function updateBulkActionBar() {
    const bar = document.getElementById('bulk-action-bar');
    const countLabel = document.getElementById('selected-count');
    const btnContainer = document.getElementById('bulk-task-buttons');
    
    if (selectedStudentIndices.length > 0) {
        bar.classList.replace('hidden', 'flex');
        countLabel.innerText = `${selectedStudentIndices.length} Đã chọn`;
        
        // Các nút "Xong..." màu tím
        let html = currentClass.tasks.map((task, tIdx) => `
            <button onclick="applyBulkTask(${tIdx})" class="bg-purple-600 hover:bg-purple-700 text-[10px] font-bold px-4 py-2 rounded-xl transition-all uppercase whitespace-nowrap">
                Xong ${task}
            </button>
        `).join('');

        // THÊM NÚT "HỦY NHIỆM VỤ" (Để bỏ các dấu tick nhiệm vụ)
        html += `
            <button onclick="resetTasksForSelected()" class="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold px-4 py-2 rounded-xl transition-all uppercase border border-red-500/20 ml-2">
                <i class="fas fa-eraser mr-1"></i> Hủy nhiệm vụ
            </button>
        `;

        // Nút "Bỏ chọn" để thoát (Deselect)
        html += `
            <button onclick="clearSelection()" class="bg-gray-700 hover:bg-gray-600 text-[10px] font-bold px-4 py-2 rounded-xl transition-all uppercase border border-gray-600 ml-2">
                <i class="fas fa-times mr-1"></i> Thoát
            </button>
        `;
        
        btnContainer.innerHTML = html;
    } else {
        bar.classList.replace('flex', 'hidden');
    }
}
// bulk-task-handler.js

function updateBulkActionBar() {
    const bar = document.getElementById('bulk-action-bar');
    const countLabel = document.getElementById('selected-count');
    const btnContainer = document.getElementById('bulk-task-buttons');
    
    if (selectedStudentIndices.length > 0) {
        bar.classList.replace('hidden', 'flex');
        countLabel.innerText = `${selectedStudentIndices.length} Đã chọn`;
        
        // 1. Tạo các nút nhiệm vụ màu tím
        let html = currentClass.tasks.map((task, tIdx) => `
            <button onclick="applyBulkTask(${tIdx})" class="bg-purple-600 hover:bg-purple-700 text-[10px] font-bold px-4 py-2 rounded-xl transition-all uppercase whitespace-nowrap">
                Xong ${task}
            </button>
        `).join('');

        // 2. Nút Hủy nhiệm vụ
        html += `
            <button onclick="resetTasksForSelected()" class="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold px-4 py-2 rounded-xl transition-all uppercase border border-red-500/20 ml-2">
                <i class="fas fa-eraser mr-1"></i> Hủy nhiệm vụ
            </button>
        `;

        // 3. MỚI: Nút Xóa đoàn viên (Màu đỏ đậm để cảnh báo)
        html += `
            <button onclick="bulkDeleteMembers()" class="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-4 py-2 rounded-xl transition-all uppercase whitespace-nowrap ml-2 shadow-lg shadow-red-100">
                <i class="fas fa-trash-alt mr-1"></i> Xóa đoàn viên
            </button>
        `;

        // 4. Nút Thoát
        html += `
            <button onclick="clearSelection()" class="bg-gray-700 hover:bg-gray-600 text-[10px] font-bold px-4 py-2 rounded-xl transition-all uppercase border border-gray-600 ml-2">
                <i class="fas fa-times mr-1"></i> Thoát
            </button>
        `;
        
        btnContainer.innerHTML = html;
    } else {
        bar.classList.replace('flex', 'hidden');
    }
}
// bulk-task-handler.js

function bulkDeleteMembers() {
    if (selectedStudentIndices.length === 0) return;

    // Bước xác nhận để tránh xóa nhầm
    if (!confirm(`Đức có chắc chắn muốn XÓA VĨNH VIỄN ${selectedStudentIndices.length} đoàn viên đã chọn không?`)) return;

    // Sắp xếp index từ lớn đến nhỏ để khi xóa (splice) không bị lệch vị trí mảng
    const sortedIndices = [...selectedStudentIndices].sort((a, b) => b - a);
    
    sortedIndices.forEach(idx => {
        currentClass.students.splice(idx, 1);
    });

    // Tự động cập nhật lại sĩ số lớp sau khi xóa
    currentClass.members = currentClass.students.length;

    saveAndRefresh(); // Lưu vào LocalStorage và vẽ lại bảng
    clearSelection(); // Xóa trạng thái tích chọn
    alert(`Đã xóa thành công ${sortedIndices.length} đoàn viên khỏi hệ thống!`);
}