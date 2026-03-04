import jsPDF from "jspdf";
import QRCode from "qrcode";

interface CertificateData {
  productName: string;
  productImage?: string;
  orderId: string;
  userEmail?: string;
  activatedAt: string;
  expiresAt: string;
}

export async function generateWarrantyCertificate({
  productName,
  productImage,
  orderId,
  userEmail,
  activatedAt,
  expiresAt,
}: CertificateData) {

  const pdf = new jsPDF("p", "mm", "a4");
  const width = pdf.internal.pageSize.getWidth();

  /* Title */

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(26);
  pdf.text("Warranty Certificate", width / 2, 30, { align: "center" });

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text("Nexaura Official Warranty", width / 2, 40, { align: "center" });

  /* Product Image */

  if (productImage) {

    const imgBlob = await fetch(productImage).then((r) => r.blob());

    const imgBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(imgBlob);
    });

    pdf.addImage(imgBase64, "JPEG", width / 2 - 30, 50, 60, 60);
  }

  /* Details */

  pdf.setFontSize(14);

  pdf.text(`Product: ${productName}`, 20, 130);
  pdf.text(`Order ID: ${orderId}`, 20, 140);
  pdf.text(`Customer: ${userEmail || "N/A"}`, 20, 150);

  pdf.text(`Activated: ${new Date(activatedAt).toDateString()}`, 20, 160);
  pdf.text(`Expires: ${new Date(expiresAt).toDateString()}`, 20, 170);

  /* QR Verification */

  const verifyUrl = `https://nexaura.in/warranty/verify/${orderId}`;

  const qr = await QRCode.toDataURL(verifyUrl);

  pdf.addImage(qr, "PNG", width - 60, 140, 40, 40);

  pdf.setFontSize(10);
  pdf.text("Scan to verify warranty", width - 60, 185);

  /* Footer */

  pdf.setFontSize(10);
  pdf.text(
    "This certificate confirms warranty coverage provided by Nexaura.",
    width / 2,
    270,
    { align: "center" }
  );

  pdf.save(`Nexaura-Warranty-${orderId}.pdf`);
}