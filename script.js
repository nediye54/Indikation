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
