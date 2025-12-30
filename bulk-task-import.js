// bulk-task-import.js - Xử lý nhập tiến độ hàng loạt theo từng Sheet lớp

let bulkTaskTempData = {}; // Chuyển sang Object để lưu dữ liệu theo từng Sheet

// 1. Mở/Đóng Modal
function openBulkTaskModal() {
    document.getElementById('bulk-task-modal').classList.replace('hidden', 'flex');
}

function closeBulkTaskModal() {
    document.getElementById('bulk-task-modal').classList.replace('flex', 'hidden');
    document.getElementById('bulk-task-input').value = "";
    document.getElementById('bulk-task-file-name').innerText = "Nhấp để chọn file Excel tiến độ";
    bulkTaskTempData = {};
}

// 2. TẠO TEMPLATE CHIA THEO SHEET TÊN CHI ĐOÀN
function downloadBulkTaskTemplate() {
    if (!classes || classes.length === 0) {
        return alert("Đức ơi, hệ thống chưa có lớp nào. Hãy nhập danh sách Chi đoàn trước!");
    }

    const workbook = XLSX.utils.book_new();
    // Lấy danh sách nhiệm vụ chuẩn từ lớp đầu tiên
    const tasks = classes[0].tasks || ["Sổ đoàn", "Lệ phí", "Học tập"];
    const headers = ["Họ và Tên", "Mã Sinh Viên", ...tasks.map(t => `${t} (X)`)];

    classes.forEach(c => {
        const studentData = [headers];
        
        if (c.students && c.students.length > 0) {
            c.students.forEach(s => {
                const row = [s.name, s.msv || ""];
                tasks.forEach(() => row.push("")); // Ô trống để điền X
                studentData.push(row);
            });
        }

        // Tạo Sheet cho từng Chi đoàn
        const worksheet = XLSX.utils.aoa_to_sheet(studentData);
        
        // Chỉnh độ rộng cột
        worksheet['!cols'] = [{ wch: 25 }, { wch: 15 }, ...tasks.map(() => ({ wch: 15 }))];

        // Tên Sheet là tên Chi đoàn (Giới hạn 31 ký tự của Excel)
        const sheetName = c.name.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, "_");
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    XLSX.writeFile(workbook, `Template_Nhiem_Vu_Chia_Sheet_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
}

// 3. ĐỌC DỮ LIỆU TỪ TẤT CẢ CÁC SHEET
function handleBulkTaskExcel(input) {
    const file = input.files[0];
    if (!file) return;

    document.getElementById('bulk-task-file-name').innerText = "Đã chọn: " + file.name;
    const reader = new FileReader();

    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        bulkTaskTempData = {}; // Reset dữ liệu tạm
        let totalRows = 0;

        // Duyệt qua tất cả các Sheet trong file Đức tải lên
        workbook.SheetNames.forEach(sheetName => {
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            if (rows.length > 0) {
                bulkTaskTempData[sheetName] = rows;
                totalRows += rows.length;
            }
        });

        if (totalRows > 0) {
            const btn = document.getElementById('confirm-bulk-task-btn');
            btn.disabled = false;
            btn.classList.replace('bg-gray-200', 'bg-purple-600');
            alert(`Đã đọc xong ${workbook.SheetNames.length} lớp với tổng ${totalRows} đoàn viên!`);
        }
    };
    reader.readAsArrayBuffer(file);
}

// 4. CẬP NHẬT DỮ LIỆU VÀO HỆ THỐNG
function processBulkTaskImport() {
    const sheetNames = Object.keys(bulkTaskTempData);
    if (sheetNames.length === 0) return;

    let updatedCount = 0;

    sheetNames.forEach(sheetName => {
        // Tìm lớp có tên khớp với tên Sheet (không phân biệt hoa thường)
        const targetClass = classes.find(c => 
            c.name.toUpperCase() === sheetName.toUpperCase() || 
            c.name.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, "_").toUpperCase() === sheetName.toUpperCase()
        );

        if (targetClass && targetClass.students) {
            const rows = bulkTaskTempData[sheetName];
            const tasks = targetClass.tasks || ["Sổ đoàn", "Lệ phí", "Học tập"];

            rows.forEach(row => {
                const sName = String(row["Họ và Tên"] || "").trim();
                const sMSV = String(row["Mã Sinh Viên"] || "").trim();

                const student = targetClass.students.find(s => 
                    (sMSV && String(s.msv) === sMSV) || (s.name.toUpperCase() === sName.toUpperCase())
                );

                if (student) {
                    student.checkpoints = tasks.map(task => {
                        const val = row[`${task} (X)`];
                        return String(val || "").toUpperCase() === "X";
                    });
                    updatedCount++;
                }
            });
        }
    });

    // Lưu và đồng bộ giao diện
    localStorage.setItem('classes', JSON.stringify(classes));
    if (typeof renderClasses === 'function') renderClasses();
    if (typeof updateStats === 'function') updateStats();
    
    closeBulkTaskModal();
    alert(`Đã cập nhật xong tiến độ cho ${updatedCount} đoàn viên từ các lớp!`);
}