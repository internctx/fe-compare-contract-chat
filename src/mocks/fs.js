// src/mocks/fs.js
module.exports = {
  readFileSync: () => {
    console.warn("fs.readFileSync called in browser, returning empty data.");
    return ''; // Trả về chuỗi rỗng hoặc Buffer rỗng
  },
  // Thêm các hàm fs khác nếu lỗi xuất hiện cho chúng
  // ví dụ: writeFileSync: () => {}
};