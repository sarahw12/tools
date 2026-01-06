// Compare return models for 5.5% percentage withdrawals
// Run: node tests/compare_models.js

function randomNormal() {
    let u1 = Math.random();
    let u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
function randomStudentT(df) {
    const z = randomNormal();
    let sumSq = 0;
    for (let i = 0; i < Math.max(1, Math.floor(df)); i++) {
        const zi = randomNormal();
        sumSq += zi * zi;
    }
    const scale = Math.sqrt(sumSq / df);
    return z / scale;
}

function sampleReturnDecimal(meanPercent, stdDevPercent, model, tDf) {
    const mean = parseFloat(meanPercent) || 0;
    const sd = parseFloat(stdDevPercent) || 0;
    const fee = 0; // no fee for this test

    let r = 0; // percent
    if (model === 'arithmetic') {
        r = mean + randomNormal() * sd;
    } else if (model === 'lognormal') {
        const m = mean / 100;
        const s = sd / 100;
        const M = 1 + m;
        const V = s * s;
        if (V <= 0) {
            r = mean;
        } else {
            const sigma2 = Math.log(1 + V / (M * M));
            const sigma = Math.sqrt(Math.max(0, sigma2));
            const mu = Math.log(M) - sigma2 / 2;
            const y = mu + randomNormal() * sigma;
            const X = Math.exp(y);
            r = (X - 1) * 100;
        }
    } else if (model === 'studentt') {
        const df = Math.max(2, parseFloat(tDf) || 5);
        const tRaw = randomStudentT(df);
        const tVar = df > 2 ? (df / (df - 2)) : 1;
        const scale = (sd / 100) / Math.sqrt(tVar);
        r = mean + tRaw * (scale * 100);
    }
    const netPercent = r - fee;
    let retDecimal = netPercent / 100;
    if (retDecimal <= -1) retDecimal = -0.999999;
    return retDecimal;
}

function runSim({initial=2000000, ratePercent=5.5, mean=6, sd=12, years=30, sims=10000, model='arithmetic', tDf=5}){
    const finals = [];
    let failures = 0;
    for (let sim=0; sim<sims; sim++){
        let balance = initial;
        let failed = false;
        for (let year=0; year<years; year++){
            const withdrawal = balance * (ratePercent/100);
            balance -= withdrawal;
            if (balance <= 0){ failed=true; balance = 0; break; }
            const r = sampleReturnDecimal(mean, sd, model, tDf);
            balance = balance * (1 + r);
            if (!isFinite(balance) || isNaN(balance)) { failed=true; balance=0; break; }
        }
        if (failed) failures++;
        finals.push(balance);
    }
    finals.sort((a,b)=>a-b);
    const p = (q)=>{
        const n = finals.length;
        const pos = (n-1)*q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (base+1 < n) return finals[base] + rest*(finals[base+1]-finals[base]);
        return finals[base];
    };
    const sum = finals.reduce((a,b)=>a+b,0);
    return {
        model, sims, failures, failureRate: failures/sims*100,
        meanFinal: sum/sims,
        p10: p(0.1), p50: p(0.5), p90: p(0.9)
    };
}

function fmt(n){ return '$' + Math.round(n).toLocaleString(); }

const params = { initial:2000000, ratePercent:5.5, mean:6, sd:12, years:30, sims:10000 };
const models = [ ['arithmetic','Arithmetic Normal'], ['lognormal','Lognormal'], ['studentt','Student-t (df=5)'] ];

console.log('Running', params.sims, 'sims each — this may take a moment...');

for (const [key,label] of models){
    const res = runSim({...params, model:key, tDf:5});
    console.log('\nModel:', label);
    console.log('Failure rate:', res.failureRate.toFixed(2)+'%');
    console.log('Median final:', fmt(res.p50));
    console.log('10th percentile:', fmt(res.p10));
    console.log('90th percentile:', fmt(res.p90));
    console.log('Mean final:', fmt(res.meanFinal));
}
