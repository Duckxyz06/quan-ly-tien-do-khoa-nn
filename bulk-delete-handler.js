// bulk-delete-handler.js

// Biến trạng thái
let isEditMode = false;
let selectedIndices = new Set();

/**
 * Hàm cập nhật con số hiển thị trên nút Xóa
 */
function updateDeleteCount() {
    const countDisplay = document.getElementById('selected-count');
    if (countDisplay) {
        // Ghi số lượng mục đã chọn vào thẻ span
        countDisplay.innerText = selectedIndices.size;
    }
}

/**
 * Hàm 1: Bật/Tắt chế độ Chỉnh sửa
 */
function toggleEditMode() {
    isEditMode = !isEditMode;
    
    const btn = document.getElementById('btn-edit-toggle');
    const deleteBtn = document.getElementById('btn-bulk-delete');
    const selectAllBox = document.getElementById('select-all-box');

    if (isEditMode) {
        btn.innerHTML = '<i class="fas fa-times text-red-500"></i> Thoát';
        btn.classList.add('border-red-500', 'text-red-600');
        if (deleteBtn) deleteBtn.classList.remove('hidden');
        if (selectAllBox) selectAllBox.classList.replace('hidden', 'flex');
        
        selectedIndices.clear();
        updateDeleteCount(); // Reset số về 0 khi bắt đầu
    } else {
        btn.innerHTML = '<i class="fas fa-pen-nib text-blue-500"></i> Edit';
        btn.classList.remove('border-red-500', 'text-red-600');
        if (deleteBtn) deleteBtn.classList.add('hidden');
        if (selectAllBox) selectAllBox.classList.replace('flex', 'hidden');
    }

    if (typeof renderClasses === 'function') renderClasses();
}

/**
 * Hàm 2: Chọn/Bỏ chọn từng cái
 */
function toggleSelectClass(index) {
    if (selectedIndices.has(index)) {
        selectedIndices.delete(index);
    } else {
        selectedIndices.add(index);
    }
    updateDeleteCount(); // <--- PHẢI CÓ DÒNG NÀY ĐỂ HIỆN SỐ
    renderClasses();
}

/**
 * Hàm 3: Chọn tất cả
 */
function selectAllClasses(checkbox) {
    if (checkbox.checked) {
        classes.forEach((_, index) => selectedIndices.add(index));
    } else {
        selectedIndices.clear();
    }
    updateDeleteCount(); // <--- PHẢI CÓ DÒNG NÀY ĐỂ HIỆN SỐ
    renderClasses();
}

/**
 * Hàm 4: Thực hiện xóa
 */
function deleteSelectedClasses() {
    if (selectedIndices.size === 0) {
        return alert("Đức ơi, bạn chưa chọn chi đoàn nào để xóa!");
    }
    
    const count = selectedIndices.size;
    if (confirm(`Đức có chắc chắn muốn xóa ${count} chi đoàn đã chọn không?`)) {
        // Lọc lấy các lớp KHÔNG bị chọn
        // Lưu ý quan trọng: Biến 'classes' phải khai báo bằng 'let' ở shared.js
        classes = classes.filter((_, index) => !selectedIndices.has(index));
        
        // Lưu và cập nhật lại toàn bộ
        if (typeof saveData === 'function') saveData();
        
        selectedIndices.clear();
        updateDeleteCount();
        isEditMode = false;
        toggleEditMode(); // Thoát chế độ edit
        
        // Vẽ lại giao diện (Hàm này nằm trong script.js)
        if (typeof renderClasses === 'function') renderClasses();
        
        alert(`Đã xóa thành công ${count} chi đoàn!`);
    }
}