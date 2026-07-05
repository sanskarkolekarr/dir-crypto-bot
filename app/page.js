"use client";

import { useState, useRef, useEffect } from "react";

const COINS = [
  { id: "solana", name: "Solana", balance: 90888, emoji: "🟣" },
  { id: "usdt", name: "USDT", balance: 1300349, emoji: "💚" },
  { id: "dai", name: "DAI", balance: 70000, emoji: "🟡" },
  { id: "eth", name: "ETH", balance: 388000, emoji: "🔵" },
];

const MIN_BUMP = 600;
const STEPS = {
  COIN_SELECT: "COIN_SELECT",
  AWAITING_ADDRESS: "AWAITING_ADDRESS",
  AWAITING_AMOUNT: "AWAITING_AMOUNT",
};

function formatCurrency(n) {
  return "$" + Number(n).toLocaleString("en-US");
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(STEPS.COIN_SELECT);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [inputPlaceholder, setInputPlaceholder] = useState("Select a coin above...");
  const [inputDisabled, setInputDisabled] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [actionButtons, setActionButtons] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showActions]);

  useEffect(() => {
    setMessages([
      {
        type: "bot",
        text: "💼 Welcome to CryptoWallet!\n\nClick a coin below to check your balance and withdraw funds.",
      },
    ]);
  }, []);

  const addMessage = (type, text) => {
    setMessages((prev) => [...prev, { type, text }]);
  };

  const handleCoinSelect = (coin) => {
    setSelectedCoin(coin);
    addMessage("user", `${coin.emoji} ${coin.name}`);
    addMessage(
      "bot",
      `Wallet balance: *${formatCurrency(coin.balance)}* available.\n\nPlease send the address on which you want to withdraw funds:`
    );
    setStep(STEPS.AWAITING_ADDRESS);
    setInputPlaceholder("Enter your wallet address...");
    setInputDisabled(false);
    setShowActions(false);
    setInputValue("");
  };

  const handleSend = () => {
    const val = inputValue.trim();
    if (!val) return;

    if (step === STEPS.AWAITING_ADDRESS) {
      addMessage("user", val);
      addMessage("bot", "💰 Enter withdrawal amount in USD:");
      setStep(STEPS.AWAITING_AMOUNT);
      setInputPlaceholder("Enter amount (e.g. 500)...");
      setInputValue("");
    } else if (step === STEPS.AWAITING_AMOUNT) {
      const cleaned = val.replace(/[,/$]/g, "");
      const amount = parseFloat(cleaned);
      if (isNaN(amount) || amount <= 0) {
        addMessage("user", val);
        addMessage("bot", "❌ Please enter a valid amount.");
        setInputValue("");
        return;
      }

      const fakeMin = amount + MIN_BUMP;
      addMessage("user", formatCurrency(amount));
      addMessage("bot", `❌ *Minimum withdrawal amount is ${formatCurrency(fakeMin)}.*`);
      setInputDisabled(true);
      setInputPlaceholder("Select an option...");
      setShowActions(true);
      setActionButtons([
        {
          label: "🔄 Try Again",
          type: "primary",
          action: "try_again",
        },
        {
          label: "❌ Cancel",
          type: "danger",
          action: "cancel",
        },
      ]);
      setInputValue("");
    }
  };

  const handleAction = (action) => {
    if (action === "try_again") {
      addMessage("system", "You selected: Try Again");
      addMessage("bot", "💰 Enter withdrawal amount in USD:");
      setStep(STEPS.AWAITING_AMOUNT);
      setInputPlaceholder("Enter amount (e.g. 500)...");
      setInputDisabled(false);
      setShowActions(false);
    } else if (action === "cancel") {
      addMessage("system", "You selected: Cancel");
      setStep(STEPS.COIN_SELECT);
      setSelectedCoin(null);
      setInputDisabled(true);
      setInputPlaceholder("Select a coin above...");
      setShowActions(false);
      addMessage(
        "bot",
        "Operation cancelled. Select a coin to start over:"
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !inputDisabled) {
      handleSend();
    }
  };

  return (
    <>
      <div className="chat-container">
        <div className="chat-header">
          <h1>💼 CryptoWallet</h1>
          <p>Cybersecurity Awareness Demo</p>
        </div>

        <div className="messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`message ${msg.type}`}
              style={{
                whiteSpace: "pre-line",
                ...(msg.type === "bot"
                  ? { fontWeight: msg.text.includes("❌") ? "500" : "400" }
                  : {}),
              }}
            >
              {msg.text.replace(/\*/g, "")}
            </div>
          ))}

          {messages.length === 1 && (
            <div className="coin-grid">
              {COINS.map((coin) => (
                <button
                  key={coin.id}
                  className="coin-btn"
                  onClick={() => handleCoinSelect(coin)}
                >
                  <span className="name">
                    {coin.emoji} {coin.name}
                  </span>
                  <span className="balance">
                    {formatCurrency(coin.balance)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === STEPS.COIN_SELECT && messages.length > 2 && (
            <div className="coin-grid">
              {COINS.map((coin) => (
                <button
                  key={coin.id}
                  className="coin-btn"
                  onClick={() => handleCoinSelect(coin)}
                >
                  <span className="name">
                    {coin.emoji} {coin.name}
                  </span>
                  <span className="balance">
                    {formatCurrency(coin.balance)}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {showActions && (
          <div className="buttons-area">
            {actionButtons.map((btn, i) => (
              <button
                key={i}
                className={`action-btn ${btn.type}`}
                onClick={() => handleAction(btn.action)}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        <div className="input-area">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            disabled={inputDisabled}
          />
          <button onClick={handleSend} disabled={inputDisabled}>
            Send
          </button>
        </div>
      </div>

      <div className="disclaimer">
        ⚠️ EDUCATIONAL DEMO — This simulates a common crypto scam technique for cybersecurity awareness purposes.
      </div>
    </>
  );
}
