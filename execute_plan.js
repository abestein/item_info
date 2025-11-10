const fs = require('fs');
const { exec } = require('child_process');

try {
    const plan = JSON.parse(fs.readFileSync('orchestration_plan.json', 'utf8'));

    console.log('🚀 EXECUTING ORCHESTRATION PLAN');
    console.log('═══════════════════════════════════════════════════════');

    let promptIndex = 0;
    function executeNextPrompt() {
        if (promptIndex >= plan.prompts.length) {
            console.log('');
            console.log('✅ All prompts executed successfully!');
            return;
        }

        const promptInfo = plan.prompts[promptIndex];
        console.log(`Executing prompt ${promptIndex + 1}/${plan.prompts.length} for ${promptInfo.agent}`);
        console.log(`Prompt: ${promptInfo.prompt}`);
        console.log('');

        const command = `powershell -Command ".\\agent.bat ${promptInfo.agent} '${promptInfo.prompt}'"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log(`❌ Error executing prompt for ${promptInfo.agent}:`);
                console.log(error.message);
            } else {
                console.log(`✅ Response from ${promptInfo.agent}:`);
                console.log(stdout);
            }

            if (stderr) {
                console.log('⚠️ Warnings:');
                console.log(stderr);
            }

            console.log('───────────────────────────────────────────────────────');
            promptIndex++;
            setTimeout(executeNextPrompt, 1000); // 1 second delay between prompts
        });
    }

    executeNextPrompt();

} catch (error) {
    console.log('❌ Error reading orchestration plan:', error.message);
}