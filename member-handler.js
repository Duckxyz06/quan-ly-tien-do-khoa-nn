// member-handler.js

// 1. Dữ liệu tạm thời để xử lý Excel
let tempMemberData = [];

// 2. Mở Modal thêm thủ công
function openAddMemberModal() {
    const modal = document.getElementById('member-modal');
    if (modal) {
        modal.classList.replace('hidden', 'flex');
        // Làm sạch form mỗi khi mở
        document.getElementById('student-name').value = "";
        document.getElementById('student-msv').value = "";
    }
}

// 3. Mở Modal nhập từ Excel
function openImportMemberExcelModal() {
    const modal = document.getElementById('import-member-modal');
    if (modal) modal.classList.replace('hidden', 'flex');
}

// 4. Đóng các Modal đoàn viên
function closeAllMemberModals() {
    document.getElementById('member-modal')?.classList.replace('flex', 'hidden');
    document.getElementById('import-member-modal')?.classList.replace('flex', 'hidden');
    // Reset input file
    const fileInput = document.getElementById('member-excel-input');
    if (fileInput) fileInput.value = "";
    document.getElementById('member-file-name').innerText = "Nhấp để chọn file Excel";
}

// 5. Xử lý đọc file Excel Đoàn viên
function handleMemberExcelUpload(input) {
    const file = input.files[0];
    if (!file) return;

    document.getElementById('member-file-name').innerText = "Đã chọn: " + file.name;
    const reader = new FileReader();

    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Chuyển đổi: Cột A (Họ tên), Cột B (MSV)
        tempMemberData = rows.slice(1).filter(row => row[0]).map(row => ({
            name: row[0].toString().trim(),
            msv: row[1] ? row[1].toString().trim() : "",
            checkpoints: new Array(currentClass.tasks.length).fill(false)
        }));

        if (tempMemberData.length > 0) {
            const btn = document.getElementById('confirm-import-member-btn');
            btn.disabled = false;
            btn.classList.replace('bg-gray-200', 'bg-green-600');
            alert(`Đã tìm thấy ${tempMemberData.length} đoàn viên!`);
        }
    };
    reader.readAsArrayBuffer(file);
}

// 6. Xác nhận nhập từ Excel vào danh sách
function confirmImportMemberExcel() {
    if (tempMemberData.length === 0) return;
    
    currentClass.students = [...currentClass.students, ...tempMemberData];
    saveAllData(); // Lưu dữ liệu tổng vào localStorage
    renderStudentTable(); // Vẽ lại bảng
    closeAllMemberModals();
    alert(`Đã nhập thành công ${tempMemberData.length} đoàn viên!`);
}
// --- HÀM TẠI FILE MẪU EXCEL CHO ĐOÀN VIÊN ---
function downloadMemberTemplate() {
    // 1. Định nghĩa tiêu đề cột chuẩn
    const data = [
        ["Họ và Tên", "Mã Sinh Viên"], // Dòng tiêu đề
        ["Nguyễn Việt Đức", "0024417750"], // Dòng ví dụ 1
    ];

    // 2. Tạo Worksheet từ mảng dữ liệu
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 3. Chỉnh độ rộng cột cho đẹp (Cột A: 30, Cột B: 20)
    worksheet['!cols'] = [{ wch: 30 }, { wch: 20 }];

    // 4. Tạo Workbook và thêm Worksheet vào
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mau_Nhap_Doan_Vien");

    // 5. Xuất file với tên gọi chuyên nghiệp
    // Ví dụ: Mau_Nhap_DHANH24C.xlsx
    const className = currentClass ? currentClass.name.replace(/\s+/g, '_') : 'DoanVien';
    XLSX.writeFile(workbook, `Mau_Nhap_${className}.xlsx`);
}