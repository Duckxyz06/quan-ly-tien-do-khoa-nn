// status-logic.js
function getStatusTier(percent) {
    if (percent >= 80) {
        return { 
            label: "Hoàn thành tốt", 
            color: "text-green-600", 
            bg: "bg-green-50", 
            border: "border-green-200",
            icon: "fa-star" 
        };
    } else if (percent >= 50) {
        return { 
            label: "Hoàn thành", 
            color: "text-blue-600", 
            bg: "bg-blue-50", 
            border: "border-blue-200",
            icon: "fa-check-circle" 
        };
    } else {
        return { 
            label: "Chưa hoàn thành", 
            color: "text-red-500", 
            bg: "bg-red-50", 
            border: "border-red-200",
            icon: "fa-exclamation-circle" 
        };
    }
}