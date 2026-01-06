// Quick test: compare final balance when using 4% vs 5% percentage withdrawals (deterministic returns)

function simulatePercentageDet(initialBalance, ratePercent, meanReturnPercent, years) {
    let balance = initialBalance;
    const mean = meanReturnPercent / 100;
    for (let year = 0; year < years; year++) {
        const withdrawal = balance * (ratePercent / 100);
        balance -= withdrawal;
        if (balance < 0) return 0;
        balance = balance * (1 + mean);
    }
    return balance;
}

function run() {
    const initial = 2000000;
    const meanReturn = 6; // 6%
    const years = 5; // first few years
    const bal4 = simulatePercentageDet(initial, 4, meanReturn, years);
    const bal5 = simulatePercentageDet(initial, 5, meanReturn, years);
    console.log('Initial:', initial.toLocaleString());
    console.log('After', years, 'years with 4% withdrawal, balance =', Math.round(bal4).toLocaleString());
    console.log('After', years, 'years with 5% withdrawal, balance =', Math.round(bal5).toLocaleString());
    console.log('Difference (5% - 4%):', Math.round(bal5 - bal4).toLocaleString());
}

run();
