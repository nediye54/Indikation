const API = "https://api.mdg-indikation.de";

const clientId = localStorage.getItem("mdg_client_id") || crypto.randomUUID();
localStorage.setItem("mdg_client_id", clientId);

document.getElementById("analyzeBtn").onclick = async () => {

  const scores = {
    decision: value("decision"),
    load: value("load"),
    growth: value("growth"),
    power: value("power"),
    energy: value("energy")
  };

  const res = await fetch(`${API}/api/ai/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scores })
  });

  const data = await res.json();

  showFollowups(data);
};

function value(id){
  return parseInt(document.getElementById(id).value,10);
}

function showFollowups(data){
  document.getElementById("followupSection").style.display = "block";
  const container = document.getElementById("questions");
  container.innerHTML = "";

  data.followup_questions.forEach((q,i)=>{
    const div = document.createElement("div");
    div.innerHTML = `
      <p>${q}</p>
      <textarea id="answer_${i}" rows="3" style="width:100%;"></textarea>
    `;
    container.appendChild(div);
  });

  document.getElementById("finalizeBtn").onclick = async ()=>{
    const answers = {};
    data.followup_questions.forEach((_,i)=>{
      answers[`q${i}`] = document.getElementById(`answer_${i}`).value;
    });

    const res = await fetch(`${API}/api/ai/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initial_assessment: data.preliminary_assessment,
        answers
      })
    });

    const finalData = await res.json();

    document.getElementById("resultSection").style.display = "block";
    document.getElementById("resultOutput").textContent =
      JSON.stringify(finalData, null, 2);

    await fetch(`${API}/api/diagnoses`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        client_id: clientId,
        result: finalData
      })
    });
  };
}
document.getElementById("generateReportBtn").onclick = async () => {

  const assessment = JSON.parse(
    document.getElementById("resultOutput").textContent
  );

  const res = await fetch(`${API}/api/ai/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assessment })
  });

  const report = await res.json();

  renderExecutiveReport(report);
};

function renderExecutiveReport(report){

  const container = document.getElementById("reportContainer");
  container.style.display = "block";
  document.getElementById("downloadPdfBtn").style.display = "inline-block";

  container.innerHTML = `
    <div class="report">
      <h1>Executive Strategic Report</h1>

      <h2>Executive Summary</h2>
      <p>${report.executive_summary}</p>

      <h2>Structural Root Cause</h2>
      <p>${report.structural_root_cause}</p>

      <h2>Risk Amplification Dynamic</h2>
      <p>${report.risk_amplification_dynamic}</p>

      <h2>Strategic Positioning</h2>
      <p>${report.strategic_positioning}</p>

      <h2>30-60-90 Day Plan</h2>
      <h3>30 Days</h3>
      <p>${report.thirty_sixty_ninety_plan["30_days"]}</p>
      <h3>60 Days</h3>
      <p>${report.thirty_sixty_ninety_plan["60_days"]}</p>
      <h3>90 Days</h3>
      <p>${report.thirty_sixty_ninety_plan["90_days"]}</p>

      <h2>CEO Memo</h2>
      <p>${report.ceo_memo}</p>
    </div>
  `;
}

document.getElementById("downloadPdfBtn").onclick = () => {
  window.print();
};
