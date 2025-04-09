import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import moment from "moment";

export default function GoldPriceDashboard() {
  const [goldPriceUSD, setGoldPriceUSD] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [minuteHistory, setMinuteHistory] = useState([]);
  const [dayHistory, setDayHistory] = useState([]);
  const [monthHistory, setMonthHistory] = useState([]);
  const [yearHistory, setYearHistory] = useState([]);
  const [weight, setWeight] = useState(1);
  const [selectedRange, setSelectedRange] = useState("1min");

  const GOLD_API_KEY = "goldapi-it3sm99fozh1-io";
  const EXCHANGE_API_KEY = "9a800242a1c1348d620f8760";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const goldRes = await fetch("https://www.goldapi.io/api/XAU/USD", {
          headers: {
            "x-access-token": GOLD_API_KEY,
            "Content-Type": "application/json",
          },
        });
        const goldData = await goldRes.json();
        if (!goldData || typeof goldData.price !== "number") return;
        setGoldPriceUSD(goldData.price);

        const fxRes = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/USD`);
        const fxData = await fxRes.json();
        if (!fxData || !fxData.conversion_rates || typeof fxData.conversion_rates.KRW !== "number") return;
        setExchangeRate(fxData.conversion_rates.KRW);

        const now = new Date();
        const newPoint = { time: now.toLocaleTimeString(), price: goldData.price };

        setMinuteHistory((prev) => [...prev.slice(-59), newPoint]);
        setDayHistory((prev) => [...prev.slice(-23), newPoint]);
        setMonthHistory((prev) => [...prev.slice(-29), newPoint]);
      } catch (error) {
        console.error("Error fetching real-time data:", error);
      }
    };

    const fetchHistoricalData = async () => {
      try {
        const historicalPoints = [];
        const today = new Date();

        for (let i = 11; i >= 0; i--) {
          const pastDate = new Date(today);
          pastDate.setMonth(pastDate.getMonth() - i);
          const dateStr = pastDate.toISOString().split("T")[0];

          const histRes = await fetch(`https://www.goldapi.io/api/XAU/USD/${dateStr}`, {
            headers: {
              "x-access-token": GOLD_API_KEY,
              "Content-Type": "application/json",
            },
          });

          const histData = await histRes.json();
          if (!histData || typeof histData.price !== "number") continue;
          const label = moment(dateStr).format("YYYY-MM");
          historicalPoints.push({ time: label, price: histData.price });
        }

        setYearHistory(historicalPoints);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };

    fetchData();
    fetchHistoricalData();

    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const ozToGram = 31.1035;
  const goldPriceKRWPerGram = (goldPriceUSD * exchangeRate) / ozToGram;
  const DON_WEIGHT = 3.75;
  const goldPriceByKarat = (purity) => ((goldPriceKRWPerGram * purity) / 24) * weight;
  const goldPricePerDon = (purity) => ((goldPriceKRWPerGram * purity) / 24) * DON_WEIGHT;

  const getSelectedData = () => {
    if (selectedRange === "1min") return minuteHistory || [];
    if (selectedRange === "1day") return dayHistory || [];
    if (selectedRange === "1month") return monthHistory || [];
    return yearHistory || [];
  };

  const selectedData = getSelectedData();

  return (
    <div className="p-4 grid gap-4 max-w-screen-lg mx-auto">
      <h1 className="text-2xl font-bold text-center">금 시세 대시보드</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent><p className="text-sm">국제 금 시세</p><p className="text-xl font-bold">${goldPriceUSD.toFixed(2)} / oz</p></CardContent></Card>
        <Card><CardContent><p className="text-sm">환율</p><p className="text-xl font-bold">{exchangeRate.toLocaleString()} 원/$</p></CardContent></Card>
        <Card><CardContent><p className="text-sm">한국 금 가격 (24K 기준)</p><p className="text-xl font-bold">{goldPriceKRWPerGram.toFixed(0)} 원/g</p></CardContent></Card>
        {[24, 18, 14].map((karat) => (
          <Card key={karat}><CardContent><p className="text-sm">{karat}K 금 가격 (x{weight}g)</p><p className="text-xl font-bold">{goldPriceByKarat(karat).toLocaleString()} 원</p></CardContent></Card>
        ))}
        {[24, 18, 14].map((karat) => (
          <Card key={`don-${karat}`}><CardContent><p className="text-sm">{karat}K 금 가격 (1돈 = 3.75g)</p><p className="text-xl font-bold">{goldPricePerDon(karat).toLocaleString()} 원</p></CardContent></Card>
        ))}
      </div>

      <div className="mt-4">
        <label className="block text-sm mb-1">무게(g) 입력</label>
        <Input type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 1)} className="w-32" />
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">금 시세 변동 그래프</h2>
        <div className="flex gap-2 mb-2">
          <button onClick={() => setSelectedRange("1min")} className={`px-3 py-1 border rounded ${selectedRange === "1min" ? "bg-black text-white" : "bg-white"}`}>1분 단위</button>
          <button onClick={() => setSelectedRange("1day")} className={`px-3 py-1 border rounded ${selectedRange === "1day" ? "bg-black text-white" : "bg-white"}`}>1일 단위</button>
          <button onClick={() => setSelectedRange("1month")} className={`px-3 py-1 border rounded ${selectedRange === "1month" ? "bg-black text-white" : "bg-white"}`}>1달 단위</button>
          <button onClick={() => setSelectedRange("1year")} className={`px-3 py-1 border rounded ${selectedRange === "1year" ? "bg-black text-white" : "bg-white"}`}>1년 단위</button>
        </div>
        {Array.isArray(selectedData) && selectedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={selectedData}>
              <XAxis dataKey="time" />
              <YAxis domain={[goldPriceUSD - 50, goldPriceUSD + 50]} />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-sm text-gray-500">데이터를 불러오는 중입니다...</p>
        )}
      </div>
    </div>
  );
}