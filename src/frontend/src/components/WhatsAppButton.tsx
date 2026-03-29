const WHATSAPP_NUMBER = "917660005766";
const PREFILLED_MESSAGE = encodeURIComponent(
  "Hi! I'd like to place an order from Salad Khatora. Please share the menu and availability.",
);

export function WhatsAppButton() {
  const handleClick = () => {
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${PREFILLED_MESSAGE}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Order on WhatsApp"
      className="fixed bottom-6 right-5 z-50 flex items-center gap-2 bg-[#25D366] text-white rounded-full shadow-lg px-4 py-3 text-sm font-semibold hover:bg-[#20bb5a] active:scale-95 transition-all"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="w-5 h-5 fill-white flex-shrink-0"
        role="img"
        aria-label="WhatsApp"
      >
        <title>WhatsApp</title>
        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.478 2.027 7.789L0 32l8.469-2.004A15.935 15.935 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.267 13.267 0 01-6.755-1.836l-.484-.287-5.025 1.188 1.21-4.897-.316-.503A13.222 13.222 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.898c-.398-.199-2.353-1.162-2.718-1.295-.365-.133-.631-.199-.897.2-.266.398-1.03 1.295-1.264 1.561-.233.266-.465.299-.863.1-.398-.2-1.681-.62-3.202-1.977-1.184-1.057-1.983-2.362-2.216-2.76-.233-.398-.025-.613.175-.811.18-.178.398-.465.597-.698.199-.233.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.2-.897-2.162-1.23-2.96-.324-.778-.652-.672-.897-.684l-.764-.013c-.266 0-.697.1-1.063.498-.365.398-1.396 1.363-1.396 3.325s1.43 3.858 1.629 4.124c.199.266 2.815 4.298 6.82 6.028.954.411 1.698.657 2.278.841.957.305 1.829.262 2.517.159.768-.115 2.353-.963 2.685-1.892.332-.93.332-1.728.233-1.892-.099-.166-.365-.266-.763-.465z" />
      </svg>
      <span>Order on WhatsApp</span>
    </button>
  );
}
