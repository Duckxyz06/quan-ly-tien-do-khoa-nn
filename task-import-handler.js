// task-import-handler.js

let tempTaskRows = [];

function openImportTaskModal() {
    document.getElementById('import-task-modal').classList.replace('hidden', 'flex');
}

function closeImportTaskModal() {
    document.getElementById('import-task-modal').classList.replace('flex', 'hidden');
    tempTaskRows = [];
    document.getElementById('confirm-task-btn').disabled = true;
    document.getElementById('task-export-time').innerText = "";
}

// 1. Đọc file Excel và trích xuất dữ liệu
function handleTaskExcelUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length > 0) {
            tempTaskRows = rows;
            document.getElementById('task-file-label').innerText = "Đã nhận: " + file.name;
            
            // Tìm và hiển thị thời gian xuất file từ Excel
            const timeField = Object.keys(rows[0]).find(k => k.toLowerCase().includes("thời gian") || k.toLowerCase().includes("xuất"));
            if (timeField) {
                document.getElementById('task-export-time').innerText = "Thời gian file: " + rows[0][timeField];
            }

            const btn = document.getElementById('confirm-task-btn');
            btn.disabled = false;
            btn.classList.replace('bg-gray-200', 'bg-purple-600');
        }
    };
    reader.readAsArrayBuffer(file);
}

// 2. Xử lý đối soát tên và điền dấu tick
function processTaskImport() {
    if (tempTaskRows.length === 0) return;

    let matchCount = 0;
    const tasksInSystem = currentClass.tasks || [];

    tempTaskRows.forEach(row => {
        // Tìm cột chứa tên đoàn viên trong file Excel
        const nameInExcel = String(Object.values(row)[0] || "").trim().toLowerCase();
        
        // Đối soát với danh sách sinh viên hiện tại của lớp
        const student = currentClass.students.find(s => s.name.trim().toLowerCase() === nameInExcel);

        if (student) {
            matchCount++;
            tasksInSystem.forEach((taskName, tIdx) => {
                // Nếu cột trong Excel trùng tên nhiệm vụ và có đánh dấu "x" hoặc "X"
                const status = String(row[taskName] || "").toLowerCase();
                if (status === 'x') {
                    student.checkpoints[tIdx] = true;
                }
            });
        }
    });

    saveAndRefresh(); // Lưu vào LocalStorage và vẽ lại bảng
    closeImportTaskModal();
    alert(`Hoàn thành! Đã cập nhật nhiệm vụ cho ${matchCount} đoàn viên khớp tên.`);
}
// task-import-handler.js

function downloadTaskTemplate() {
    // 1. Kiểm tra xem có dữ liệu lớp không
    if (!currentClass || !currentClass.students || currentClass.students.length === 0) {
        alert("Không có dữ liệu đoàn viên để tạo file mẫu!");
        return;
    }

    // 2. Lấy danh sách nhiệm vụ của hệ thống
    const tasksInSystem = currentClass.tasks || [];
    
    // 3. Tạo tiêu đề cột: Tên đoàn viên + Các cột nhiệm vụ + Thời gian
    const headers = ["Họ và Tên Đoàn viên", ...tasksInSystem, "Thời gian xuất file"];

    // 4. Tạo dữ liệu các dòng (Dựa trên danh sách đoàn viên hiện tại)
    const currentTime = new Date().toLocaleString('vi-VN');
    const dataForExcel = currentClass.students.map(student => {
        let row = {};
        row["Họ và Tên Đoàn viên"] = student.name; // Điền sẵn tên
        
        // Để trống các cột nhiệm vụ để Bí thư chi đoàn điền 'X' hoặc 'x'
        tasksInSystem.forEach(task => {
            row[task] = ""; 
        });
        
        row["Thời gian xuất file"] = currentTime; // Ghi dấu thời gian như Đức yêu cầu
        return row;
    });

    // 5. Sử dụng thư viện XLSX để tạo file
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nhiệm vụ");

    // Tự động chỉnh độ rộng cột cho chuyên nghiệp
    const colWidths = [{ wch: 30 }]; // Cột tên rộng 30
    tasksInSystem.forEach(() => colWidths.push({ wch: 15 })); // Các cột nhiệm vụ rộng 15
    colWidths.push({ wch: 25 }); // Cột thời gian rộng 25
    worksheet['!cols'] = colWidths;

    // 6. Tải file về máy với tên của chính lớp đó
    const fileName = `Mau_Nhiem_Vu_${currentClass.name.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}