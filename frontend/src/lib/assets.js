export const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_443822b5-b39a-4ffb-8f75-45c8b728b39f/artifacts/qj7zegkh_image.png";

export const INTERIOR_URL =
  "https://customer-assets.emergentagent.com/job_443822b5-b39a-4ffb-8f75-45c8b728b39f/artifacts/tipioly7_image.png";

export const WHATSAPP_NUMBER = "5511963526798"; // placeholder — trocar quando cliente informar

export const buildWhatsappLink = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
