import React from "react";
import { Student, Payment, ReceiptType } from "@/lib/types";

export type ReceiptTemplateProps = {
  student: Student;
  receiptNumber: string;
  admissionFee: number;
  payment?: Payment;
  receiptType?: ReceiptType;
  logoUrl?: string;
  signatureUrl?: string;
};

export default function ReceiptTemplate({
  student,
  receiptNumber,
  admissionFee,
  payment,
  receiptType,
  logoUrl,
  signatureUrl,
}: ReceiptTemplateProps) {
  /* -------------------------------------------------
     DATA
  ------------------------------------------------- */

  const activeReceiptType: ReceiptType =
    receiptType ||
    payment?.receiptType ||
    (payment?.programme
      ?.toLowerCase()
      .includes("scholarship") ||
    student.programme
      ?.toLowerCase()
      .includes("scholarship")
      ? "Scholarship"
      : "Standard Training Program");

  const isPaid = payment?.paymentStatus === "Paid";
  const isPartial = payment?.paymentStatus === "Partial";

  const studentName =
    student.studentName?.trim() || "--";

  const className =
    payment?.studentClass?.trim() ||
    student.className?.trim() ||
    "--";

  const division =
    payment?.division?.trim() ||
    student.division?.trim() ||
    "";

  const classDivision = division
    ? `${className}${className.includes("-") ? "" : "-"}${division.toUpperCase()}`
    : className;

  const programme =
    payment?.programme?.trim() ||
    student.programme?.trim() ||
    "--";

  const sport =
    payment?.sport?.trim() ||
    student.sport?.trim() ||
    "--";

  /* -------------------------------------------------
     DATE FORMATTER
  ------------------------------------------------- */

  const formatDate = (value?: string | Date) => {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const paymentDate = formatDate(
    payment?.paymentDate || student.paymentDate
  );

  /* -------------------------------------------------
     CURRENCY
  ------------------------------------------------- */

  const formatCurrency = (value: number | undefined) => {
    const amount = Number(value ?? 0);

    if (Number.isNaN(amount)) {
      return "0.00";
    }

    return amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /* -------------------------------------------------
     PAYMENT VALUES
  ------------------------------------------------- */

  const admissionAmount = Number(
    payment?.admissionFee ?? admissionFee ?? 0
  );

  const monthlyAmount = Number(
    payment?.monthlyFee ?? 0
  );

  const amountPaid = Number(
    payment?.amountPaid ??
      admissionAmount + monthlyAmount
  );

  /* -------------------------------------------------
     MONTH NAME
  ------------------------------------------------- */

  const getMonthName = (value?: string | Date) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-IN", {
      month: "long",
    });
  };

  const paymentMonth = getMonthName(
    payment?.paymentDate || student.paymentDate
  );

  /* -------------------------------------------------
     DESCRIPTION
  ------------------------------------------------- */

  const admissionDescription =
    activeReceiptType === "Scholarship"
      ? "Admission Fee – Scholarship Programme"
      : "Admission Fee – Special Training Programme";

  /* -------------------------------------------------
     STYLES
  ------------------------------------------------- */

  const colors = {
    darkGreen: "#176B4D",
    green: "#198754",
    lightGreen: "#EEF8F2",
    borderGreen: "#D5E7DC",
    navy: "#193653",
    text: "#222222",
    muted: "#666666",
  };

  return (
    <div
      className="receipt-page"
      style={{
        width: "210mm",
        minHeight: "297mm",
        background: "#ffffff",
        color: colors.text,
        fontFamily: "Georgia, 'Times New Roman', serif",
        boxSizing: "border-box",
        padding: "12mm 9mm 10mm",
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "7mm",
        }}
      >
        {/* LOGO */}

        <div
          style={{
            width: "38%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src={logoUrl || "/lips-logo.png"}
            alt="Little India Public School"
            style={{
              width: "72mm",
              maxWidth: "100%",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </div>

        {/* TITLE */}

        <div
          style={{
            width: "58%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: colors.darkGreen,
              fontSize: "23px",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "0.3px",
            }}
          >
            SPECIAL TRAINING
            <br />
            PROGRAMME
          </div>

          <div
            style={{
              marginTop: "7px",
              color: colors.navy,
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "1.2px",
            }}
          >
            SPORTS • DISCIPLINE • EXCELLENCE
          </div>
        </div>
      </div>

      {/* =================================================
          TITLE BAND
      ================================================= */}

      <div
        style={{
          background: colors.lightGreen,
          padding: "11mm 8mm",
          textAlign: "center",
          marginBottom: "11mm",
        }}
      >
        <div
          style={{
            color: colors.navy,
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "7mm",
          }}
        >
          FEE PAYMENT RECEIPT
        </div>

        <div
          style={{
            fontSize: "11px",
            lineHeight: 1.6,
            color: "#444",
          }}
        >
          This is to acknowledge the receipt of admission fee for
          the Little India Public School Special Training Programme.
        </div>
      </div>

      {/* =================================================
          STUDENT DETAILS + PAYMENT STATUS
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12mm",
          marginBottom: "12mm",
          alignItems: "stretch",
        }}
      >
        {/* LEFT DETAILS */}

        <div
          style={{
            paddingTop: "2mm",
          }}
        >
          <ReceiptDetail
            label="Receipt No:"
            value={receiptNumber}
          />

          <ReceiptDetail
            label="Payment Date:"
            value={paymentDate}
          />

          <ReceiptDetail
            label="Student Name:"
            value={studentName}
          />

          <ReceiptDetail
            label="Class / Division:"
            value={classDivision}
          />

          <ReceiptDetail
            label="Programme Type:"
            value={
              programme !== "--"
                ? programme
                : activeReceiptType === "Scholarship"
                ? "Scholarship Programme"
                : "Special Training Programme"
            }
          />

          <ReceiptDetail
            label="Sport:"
            value={sport}
          />
        </div>

        {/* PAID BOX */}

        <div
          style={{
            background: colors.lightGreen,
            minHeight: "47mm",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "7mm",
          }}
        >
          <div
            style={{
              color: isPartial ? "#B7791F" : colors.green,
              fontSize: "30px",
              lineHeight: 1,
              fontWeight: 700,
              marginBottom: "5mm",
            }}
          >
            {isPartial ? "!" : "✓"}
          </div>

          <div
            style={{
              color: isPartial ? "#9A6700" : colors.darkGreen,
              fontSize: "27px",
              fontWeight: 700,
              letterSpacing: "1px",
              marginBottom: "4mm",
            }}
          >
            {isPartial ? "PARTIAL" : isPaid ? "PAID" : "UNPAID"}
          </div>

          <div
            style={{
              color: "#555",
              fontSize: "11px",
              lineHeight: 1.5,
            }}
          >
            {isPartial ? (
              <>
                Partial payment
                <br />
                received.
              </>
            ) : isPaid ? (
              <>
                Fees received
                <br />
                and confirmed.
              </>
            ) : (
              <>
                Payment
                <br />
                pending.
              </>
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          FEE TABLE
      ================================================= */}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "4mm",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                background: colors.green,
                color: "#ffffff",
                border: `1px solid ${colors.borderGreen}`,
                padding: "4mm 3mm",
                textAlign: "left",
                fontWeight: 700,
              }}
            >
              Description
            </th>

            <th
              style={{
                background: colors.green,
                color: "#ffffff",
                border: `1px solid ${colors.borderGreen}`,
                padding: "4mm 3mm",
                textAlign: "right",
                fontWeight: 700,
                width: "34%",
              }}
            >
              Amount (₹)
            </th>
          </tr>
        </thead>

        <tbody>
          {/* ADMISSION FEE */}

          {admissionAmount > 0 && (
            <tr>
              <td
                style={{
                  border: "1px solid #DCE4E8",
                  padding: "4mm 3mm",
                  color: "#222",
                }}
              >
                {admissionDescription}
              </td>

              <td
                style={{
                  border: "1px solid #DCE4E8",
                  padding: "4mm 3mm",
                  textAlign: "right",
                  fontWeight: 500,
                }}
              >
                {formatCurrency(admissionAmount)}
              </td>
            </tr>
          )}

          {/* MONTHLY FEE */}

          {monthlyAmount > 0 && (
            <tr>
              <td
                style={{
                  border: "1px solid #DCE4E8",
                  padding: "4mm 3mm",
                  color: "#222",
                }}
              >
                Monthly Fees
                {paymentMonth
                  ? ` ${paymentMonth}`
                  : ""}
              </td>

              <td
                style={{
                  border: "1px solid #DCE4E8",
                  padding: "4mm 3mm",
                  textAlign: "right",
                  fontWeight: 500,
                }}
              >
                {formatCurrency(monthlyAmount)}
              </td>
            </tr>
          )}

          {/* OTHER / FALLBACK */}

          {admissionAmount <= 0 &&
            monthlyAmount <= 0 && (
              <tr>
                <td
                  style={{
                    border: "1px solid #DCE4E8",
                    padding: "4mm 3mm",
                  }}
                >
                  Fees Received
                </td>

                <td
                  style={{
                    border: "1px solid #DCE4E8",
                    padding: "4mm 3mm",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(amountPaid)}
                </td>
              </tr>
            )}

          {/* TOTAL */}

          <tr>
            <td
              style={{
                background: colors.lightGreen,
                border: `1px solid ${colors.borderGreen}`,
                padding: "4.5mm 3mm",
                fontWeight: 700,
                color: "#111",
              }}
            >
              TOTAL AMOUNT PAID
            </td>

            <td
              style={{
                background: colors.lightGreen,
                border: `1px solid ${colors.borderGreen}`,
                padding: "4.5mm 3mm",
                textAlign: "right",
                fontWeight: 700,
                color: "#111",
                fontSize: "13px",
              }}
            >
              ₹ {formatCurrency(amountPaid)}/-
            </td>
          </tr>
        </tbody>
      </table>

      {/* =================================================
          PARTIAL BALANCE
      ================================================= */}

      {isPartial && payment && (
        <div
          style={{
            marginTop: "5mm",
            padding: "3mm 4mm",
            background: "#FFF8E7",
            border: "1px solid #E8D59A",
            fontSize: "11px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <strong>Balance Due</strong>

          <strong>
            ₹ {formatCurrency(payment.balanceDue)}/-
          </strong>
        </div>
      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15mm",
          marginTop: "24mm",
          fontSize: "11px",
        }}
      >
        {/* LEFT */}

        <div>
          <div
            style={{
              width: "42mm",
              borderTop: "1px solid #222",
              marginBottom: "4mm",
            }}
          />

          <div
            style={{
              fontWeight: 700,
              marginBottom: "3mm",
            }}
          >
            Authorised Signatory
          </div>

          <div
            style={{
              marginBottom: "3mm",
            }}
          >
            Principal (Little India Public School)
          </div>

          <div>
            <img
              src={signatureUrl || "/signature.png"}
              alt="Principal Signature"
              style={{
                height: "13mm",
                maxWidth: "42mm",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        </div>

        {/* RIGHT */}

        <div
          style={{
            textAlign: "right",
          }}
        >
          <div
            style={{
              borderTop: "1px solid #222",
              marginBottom: "5mm",
            }}
          />

          <div
            style={{
              fontWeight: 700,
              marginBottom: "5mm",
            }}
          >
            {paymentDate}
          </div>

          <div>
            Thadaparambu,Malappuram, Kerala
          </div>
        </div>
      </div>

      {/* =================================================
          PRINT CSS
      ================================================= */}

      <style jsx>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }

        .receipt-page {
          box-sizing: border-box;
          page-break-inside: avoid;
          break-inside: avoid;
          page-break-after: avoid;
          break-after: avoid;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .receipt-page {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 12mm 9mm 10mm !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

/* =====================================================
   DETAIL ROW
===================================================== */

function ReceiptDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "4px",
        marginBottom: "3.2mm",
        fontSize: "11px",
        lineHeight: 1.35,
      }}
    >
      <span
        style={{
          color: "#555",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: "#193653",
          fontWeight: 700,
        }}
      >
        {value}
      </strong>
    </div>
  );
}