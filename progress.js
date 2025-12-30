// progress.js

function renderProgressTable() {
    const body = document.getElementById('progress-body');
    const searchTerm = document.getElementById('search-class').value.toLowerCase();
    
    if (!classes || classes.length === 0) {
        body.innerHTML = `<tr><td colspan="6" class="p-20 text-center text-gray-300 italic">Chưa có dữ liệu lớp học</td></tr>`;
        return;
    }

    const filteredClasses = classes.filter(c => c.name.toLowerCase().includes(searchTerm));
    
    let totalMembers = 0;
    let totalPerfectStudents = 0;
    let sumProgress = 0;

    body.innerHTML = filteredClasses.map((c, index) => {
        const studentCount = c.students.length;
        const tasksCount = c.tasks.length;
        
        // Tính toán số lượng nhiệm vụ đã hoàn thành của cả lớp
        let completedTasksInClass = 0;
        let perfectInClass = 0;
        
        c.students.forEach(s => {
            const done = s.checkpoints.filter(v => v === true).length;
            completedTasksInClass += done;
            if (tasksCount > 0 && done === tasksCount) perfectInClass++;
        });

        const totalPossibleTasks = studentCount * tasksCount;
        const classPercent = totalPossibleTasks > 0 ? Math.round((completedTasksInClass / totalPossibleTasks) * 100) : 0;
        
        // Thống kê tổng
        totalMembers += studentCount;
        totalPerfectStudents += perfectInClass;
        sumProgress += classPercent;

        // Màu sắc dựa trên tiến độ
        const barColor = classPercent === 100 ? 'bg-green-500' : (classPercent > 50 ? 'bg-blue-500' : 'bg-orange-500');

        return `
            <tr class="hover:bg-gray-50/50 transition-colors group">
                <td class="p-5 text-center text-xs font-bold text-gray-400">${index + 1}</td>
                <td class="p-5 font-black text-gray-800 uppercase text-sm">${c.name}</td>
                <td class="p-5 text-center font-bold text-gray-600">${studentCount}</td>
                <td class="p-5 min-w-[200px]">
                    <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden shadow-inner">
                        <div class="${barColor} h-full transition-all duration-1000" style="width: ${classPercent}%"></div>
                    </div>
                </td>
                <td class="p-5 text-center font-black text-sm ${classPercent === 100 ? 'text-green-600' : 'text-blue-600'}">${classPercent}%</td>
                <td class="p-5 text-right">
                    <button onclick="goToClassDetail('${c.name}')" class="text-[10px] font-bold bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all uppercase">
                        Chi tiết
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Cập nhật các ô thống kê trên đầu
    document.getElementById('total-classes').innerText = classes.length;
    document.getElementById('total-members').innerText = totalMembers;
    document.getElementById('total-perfect').innerText = totalPerfectStudents;
    const avgProgress = classes.length > 0 ? Math.round(sumProgress / classes.length) : 0;
    document.getElementById('overall-percent').innerText = avgProgress + "%";
}

function goToClassDetail(className) {
    localStorage.setItem('currentClassName', className);
    location.href = 'details.html';
}

// Khởi chạy khi load trang
document.addEventListener('DOMContentLoaded', renderProgressTable);