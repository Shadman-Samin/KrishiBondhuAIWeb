export const MODEL_CLASS_TO_DISEASE: Record<string, number> = {
  "rice blast": 0,
  "tomato late blight": 1,
  "potato late blight": 1,
  "banana panama disease": 3,
};

export type Disease = {
  name: string;
  nameBn: string;
  crops: string[];
  cropsBn: string[];
  symptoms: string[];
  symptomsBn: string[];
  severity: "low" | "medium" | "high";
  organicTreatment: string;
  organicTreatmentBn: string;
  chemicalTreatment: string;
  chemicalTreatmentBn: string;
  prevention: string;
  preventionBn: string;
};

export const DISEASES: Disease[] = [
  {
    name: "Blast Disease",
    nameBn: "ব্লাস্ট রোগ",
    crops: ["Rice"],
    cropsBn: ["ধান"],
    symptoms: [
      "Diamond-shaped lesions on leaves",
      "Neck rot at panicle base",
      "White lesions on leaf tips",
    ],
    symptomsBn: ["পাতায় হীরকাকার দাগ", "ঘুটির ভিত্তিতে ঘুটি পচন", "পাতার ডগায় সাদা দাগ"],
    severity: "high",
    organicTreatment:
      "Spray Trichoderma viride (4g/L) or Pseudomonas fluorescens (5g/L). Remove infected plant debris.",
    organicTreatmentBn:
      "ট্রাইকোডার্মা ভাইরাইডে (৪গ্রাম/লিটার) বা পসিডোমোনাস ফ্লুরেসেন্স (৫গ্রাম/লিটার) স্প্রে করুন। আক্রান্ত গাছের অংশ সরিয়ে ফেলুন।",
    chemicalTreatment:
      "Tricyclazole 75% WP (0.6g/L) or Isoprothiolane 40% EC (1.5ml/L). Spray at booting stage.",
    chemicalTreatmentBn:
      "ট্রাইসাইক্লাজোল ৭৫% ডব্লিউপি (০.৬গ্রাম/লিটার) বা আইসোপ্রোথিওলান ৪০% ইসি (১.৫মিলি/লিটার)। বুট পর্যায়ে স্প্রে করুন।",
    prevention:
      "Use resistant varieties (BRRI dhan28, BRRI dhan42). Balanced nitrogen application. Maintain proper spacing.",
    preventionBn:
      "প্রতিরোধী জাত ব্যবহার করুন (বিআরআরআই ধান২৮, বিআরআরআই ধান৪২)। সুষম নাইট্রোজেন প্রয়োগ। সঠিক দূরত্ব বজায় রাখুন।",
  },
  {
    name: "Late Blight",
    nameBn: "লেট ব্লাইট",
    crops: ["Potato", "Tomato"],
    cropsBn: ["আলু", "টমেটো"],
    symptoms: [
      "Water-soaked lesions on leaves",
      "White fuzzy growth on leaf undersides",
      "Dark brown spots on stems",
    ],
    symptomsBn: ["পাতায় জলাক্ত দাগ", "পাতার নিচে সাদা ঝাঁঁঁকালো বৃদ্ধি", "কাণ্ডে গাঢ় বাদামী দাগ"],
    severity: "high",
    organicTreatment:
      "Bordeaux mixture (1%). Garlic extract spray. Remove and destroy infected plants immediately.",
    organicTreatmentBn:
      "বর্দো মিশ্রণ (১%)। রসুনের নির্যাস স্প্রে। আক্রান্ত গাছ তৎক্ষণাৎ সরিয়ে ধ্বংস করুন।",
    chemicalTreatment:
      "Mancozeb 75% WP (2.5g/L) or Metalaxyl + Mancozeb (2g/L). Spray every 7–10 days.",
    chemicalTreatmentBn:
      "ম্যানকোজেব ৭৫% ডব্লিউপি (২.৫গ্রাম/লিটার) বা মেটালাক্সিল + ম্যানকোজেব (২গ্রাম/লিটার)। ৭–১০ দিন পরপর স্প্রে করুন।",
    prevention: "Use certified seed. Ensure good air circulation. Avoid overhead irrigation.",
    preventionBn:
      "সার্টিফাইড বীজ ব্যবহার করুন। ভালো বাতাস চলাচল নিশ্চিত করুন। উপরে সেচ এড়িয়ে চলুন।",
  },
  {
    name: "Bacterial Leaf Blight",
    nameBn: "ব্যাকটেরিয়াল লিফ ব্লাইট",
    crops: ["Rice"],
    cropsBn: ["ধান"],
    symptoms: [
      "Yellow streaks along leaf veins",
      "Leaves turning yellow from tips",
      "Bacterial ooze on leaf margins",
    ],
    symptomsBn: [
      "পাতার শিরা বরাবর হলুদ দাগ",
      "পাতা ডগা থেকে হলুদ হয়ে যাওয়া",
      "পাতার প্রান্তে ব্যাকটেরিয়াল ক্ষরণ",
    ],
    severity: "medium",
    organicTreatment:
      "Pseudomonas fluorescens (10g/L). Neem seed kernel extract (5%). Remove infected leaves.",
    organicTreatmentBn:
      "পসিডোমোনাস ফ্লুরেসেন্স (১০গ্রাম/লিটার)। নিম বীজের নির্যাস (৫%)। আক্রান্ত পাতা সরিয়ে ফেলুন।",
    chemicalTreatment: "Copper hydroxide 77% WP (2g/L). Spray at first symptom appearance.",
    chemicalTreatmentBn:
      "কপার হাইড্রক্সাইড ৭৭% ডব্লিউপি (২গ্রাম/লিটার)। প্রথম উপসর্গ দেখা মাত্র স্প্রে করুন।",
    prevention: "Use resistant varieties. Avoid excess nitrogen. Drain fields periodically.",
    preventionBn:
      "প্রতিরোধী জাত ব্যবহার করুন। অতিরিক্ত নাইট্রোজেন এড়িয়ে চলুন। মাঝে মাঝে ক্ষেত শুকিয়ে নিন।",
  },
  {
    name: "Fusarium Wilt",
    nameBn: "ফিউজেরিয়াম দমন",
    crops: ["Banana", "Tomato"],
    cropsBn: ["কলা", "টমেটো"],
    symptoms: [
      "Yellowing of lower leaves",
      "Vascular browning in stems",
      "Plant wilting despite adequate moisture",
    ],
    symptomsBn: [
      "নিচের পাতা হলুদ হওয়া",
      "কাণ্ডে রক্তনালী বাদামী হওয়া",
      "পর্যাপ্ত আর্দ্থা সত্ত্বেও গাছ ঝরে পড়া",
    ],
    severity: "high",
    organicTreatment:
      "Trichoderma harzianum in soil (4g/pit). Banana pseudostem disposal. Crop rotation for 3+ years.",
    organicTreatmentBn:
      "�াটিতে ট্রাইকোডার্মা হারজিয়ানুম (৪গ্রাম/গর্ত)। কলার কাণ্ড পুড়িয়ে ফেলুন। ৩+ বছর ফসল চক্র।",
    chemicalTreatment:
      "Carbendazim 50% WP (1g/L) soil drenching. Fosetyl-Al 80% WP (2.5g/L) foliar spray.",
    chemicalTreatmentBn:
      "কার্বেন্ডাজিম ৫০% ডব্লিউপি (১গ্রাম/লিটার) মাটিতে ঢালুন। ফসিটিল-আল ৮০% ডব্লিউপি (২.৫গ্রাম/লিটার) পাতায় স্প্রে।",
    prevention:
      "Plant in well-drained soil. Use disease-free planting material. Solarize soil before planting.",
    preventionBn:
      "ভালো নিষ্কাশিত মাটিতে রোপণ করুন। রোগমুক্ত বীজসামগ্রী ব্যবহার করুন। রোপণের আগে মাটি সোলারাইজ করুন।",
  },
  {
    name: "Aphid Infestation",
    nameBn: "মৌসুমি পোকা আক্রমণ",
    crops: ["Wheat", "Mustard", "Potato"],
    cropsBn: ["গম", "সরিষা", "আলু"],
    symptoms: ["Curled and distorted leaves", "Sticky honeydew on surfaces", "Stunted growth"],
    symptomsBn: ["পাতা কুঁচকানো ও বিকৃত", "পৃষ্ঠে আঠালো মধুর আবরণ", "বৃদ্ধি বাধাগ্রস্ত"],
    severity: "medium",
    organicTreatment:
      "Neem oil spray (3ml/L). Introduce ladybug predators. Strong water spray to dislodge.",
    organicTreatmentBn:
      "নিম তেল স্প্রে (৩মিলি/লিটার)। লেডিবাগ শিকারী পোকা ছাড়ুন। জোরালো জলস্প্রে দিয়ে ছিটিয়ে দিন।",
    chemicalTreatment: "Imidacloprid 17.8% SL (0.3ml/L) or Thiamethoxam 25% WG (0.3g/L).",
    chemicalTreatmentBn:
      "ইমিডাক্লোপ্রিড ১৭.৮% এসএল (০.৩মিলি/লিটার) বা থায়ামেথোক্সাম ২৫% ডব্লিউজি (০.৩গ্রাম/লিটার)।",
    prevention:
      "Regular scouting. Use yellow sticky traps. Avoid excessive nitrogen fertilization.",
    preventionBn:
      "নিয়মিত ক্ষেত পরিদর্শন। হলুদ আঠালো ফাঁদ ব্যবহার করুন। অতিরিক্ত নাইট্রোজেন সার ব্যবহার এড়িয়ে চলুন।",
  },
];
