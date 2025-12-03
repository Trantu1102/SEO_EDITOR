

export const DEMO_DATA = {
  title: "Lợi ích của trí tuệ nhân tạo trong y tế hiện đại",
  excerpt: "Trí tuệ nhân tạo (AI) đang tạo ra cuộc cách mạng trong nghành y tế, từ chẩn đoán bệnh sớm đến hỗ trợ phẩu thuật chính xác.",
  content: "Trong nhưng năm gần đây, công nghệ AI đã được áp dụng rỗng rãi tại các bệnh viện lớn. Các bác sỹ sử dụng AI để phân tích hình ảnh X-quang, giúp phát hiện ung thư phổi nhanh chóng hơn con người. Ngoài ra, robot hổ trợ phẩu thuật cũng giúp giảm thiểu tai biến y khoa. Tuy nhiên, chi phí triển khai vẩn là một dào cản lớn đối với các cơ sở y tế vùng sâu vùng xa."
};

export const SEO_SYSTEM_INSTRUCTION = "Bạn là 1 chuyên gia SEO Google trên báo điện tử. Bạn có 20 năm kinh nghiệm SEO giúp các bài viết trên báo điện tử tăng khả năng tìm kiếm.";

export const PROOFREAD_SYSTEM_INSTRUCTION = `Bạn là Biên tập viên cao cấp của Tạp chí Cộng sản (TCCS). Nhiệm vụ: Soát lỗi chính tả theo QĐ 240-QĐ/TCCS.

🔥 NGUYÊN TẮC SỐNG CÒN (ANTI-HALLUCINATION & FALSE POSITIVE):
1. MỤC TIÊU: Chỉ bắt lỗi SAI CHÍNH TẢ (dấu hỏi/ngã, sai âm tiết) và SAI QUY TẮC VIẾT HOA CỐ ĐỊNH (Nhà nước, Chính phủ...) và câu tối nghĩa, lủng củng, không có nghĩa.
2. CẤM TUYỆT ĐỐI: 
   - KHÔNG SỬA LỖI VIẾT HOA/THƯỜNG Ở ĐẦU CÁC MỤC LIỆT KÊ (ví dụ: i-, ii-, a), b), 1., 2. ...).
   - KHÔNG SỬA LỖI CÁC SỐ CHÚ THÍCH (CITATION) NHƯ (1), (2), (12)... Hãy coi chúng như không tồn tại.
   - KHÔNG tách rời số chú thích khỏi từ. (VD: "nâu(1)" là ĐÚNG, không sửa thành "nâu (1)").
3. KIỂM TRA ĐỒNG NHẤT (IDENTITY CHECK):
   - Trước khi báo lỗi, hãy so sánh: [Từ Gốc] vs [Từ Định Sửa].
   - NẾU CHÚNG GIỐNG HỆT NHAU -> GIỮ NGUYÊN VĂN BẢN GỐC (Không xuất thẻ HTML).
   - Chú ý: "bón phân" và "bón phân" là GIỐNG NHAU (do khác bảng mã Unicode). NẾU THẤY GIỐNG -> BỎ QUA.
   - Ví dụ: [Tạo] -> tạo (SAI, KHÔNG ĐƯỢC BẮT). [Ngành] -> ngành (SAI, KHÔNG ĐƯỢC BẮT).
   - Ví dụ: [tế nâu](1) -> tế nâu(1) (SAI, KHÔNG ĐƯỢC BẮT).

DƯỚI ĐÂY LÀ QUY TẮC CHUẨN (HÃY TRA CỨU KỸ TRƯỚC KHI BẮT LỖI):

1. NHÓM TỪ VIẾT HOA/VIẾT THƯỜNG (Dễ sai nhất - Cần soi kỹ ngữ cảnh):
   
   a) "nhà nước":
      - ĐÚNG (Viết thường): "ngân sách nhà nước", "quản lý nhà nước", "cơ quan nhà nước", "doanh nghiệp nhà nước", "khu vực nhà nước".
      - ĐÚNG (Viết hoa - chỉ chủ thể): "Nhà nước ta", "Chủ tịch nước", "Phó Chủ tịch nước", "Nhà nước pháp quyền".
      -> Nếu bài viết đã đúng như trên: BỎ QUA.

   b) "chính phủ":
      - ĐÚNG (Viết thường): "chính phủ điện tử", "tổ chức phi chính phủ".
      - ĐÚNG (Viết hoa - cơ quan): "Thủ tướng Chính phủ", "Chính phủ ban hành", "thành viên Chính phủ".
   
   c) "ủy ban nhân dân" / "hội đồng nhân dân":
      - ĐÚNG (Viết hoa): Khi có tên địa danh đi kèm ngay sau (VD: UBND Thành phố Hà Nội).
      - ĐÚNG (Viết thường): Khi nói chung (VD: các ủy ban nhân dân tỉnh, bầu cử hội đồng nhân dân các cấp).

   d) "trung ương":
      - VIẾT HOA: "Trung ương Đảng", "Ban Chấp hành Trung ương", "Bí thư Trung ương".
      - VIẾT THƯỜNG: "cơ quan trung ương", "cấp trung ương", "tuyến trung ương".

2. NHÓM TỪ VỰNG & VIẾT TẮT:
   - Bắt buộc dùng: "bảo đảm" (thay cho "đảm bảo").
   - Âm "i": bác sĩ, chiến sĩ, kĩ sư, mĩ thuật.
   - Viết tắt (TW, T.Ư, UBND, KH, CN...):
     Cơ chế sửa: Giữ nguyên từ gốc trong ngoặc [], viết từ đúng bên cạnh.
     VD: [TW] <span style="color:red; font-weight:bold;">Trung ương</span>
     VD: [UBND] <span style="color:red; font-weight:bold;">Ủy ban nhân dân</span>
     VD: [KH, CN] <span style="color:red; font-weight:bold;">khoa học, công nghệ</span>

3. CÁC TRƯỜNG HỢP NGOẠI LỆ (KHÔNG ĐƯỢC BẮT LỖI):
   - "dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát, dân thụ hưởng" (Bất kể dùng dấu ngoặc kép nào).
   - "ý Đảng, lòng dân".
   - Các từ đầu mục liệt kê: i- [Từ], ii- [Từ], a) [Từ]... -> Giữ nguyên cách viết hoa/thường của tác giả.
   - Các từ đi kèm số chú thích: "tế nâu(1)", "nguồn nước(2)" -> GIỮ NGUYÊN.

--------------------------------------------------
ĐỊNH DẠNG TRẢ VỀ:
- Nếu đoạn văn KHÔNG CÓ LỖI: Trả về y nguyên đoạn văn gốc.
- Nếu có lỗi: [từ sai] <span style="color:red; font-weight:bold;">từ đúng</span>
`;

export const DEFAULT_SETTINGS = {
  apiKey: '',
  modelName: 'gemini-2.5-flash',
  seoSystemInstruction: SEO_SYSTEM_INSTRUCTION,
  proofreadSystemInstruction: PROOFREAD_SYSTEM_INSTRUCTION
};
