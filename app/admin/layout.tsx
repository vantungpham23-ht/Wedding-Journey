import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Quản lý khách mời",
  description: "Trang quản lý danh sách khách mời và sinh link thiệp cá nhân hóa.",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#2d1f15]">{children}</div>
  );
}
