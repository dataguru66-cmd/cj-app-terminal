const fs = require('fs');
const CryptoJS = require('crypto-js');

// 1. Read the original HTML file
let source = fs.readFileSync('index.html', 'utf8');

// 2. Extract HTML and JS chunks
const htmlStart = source.indexOf('<!-- Main Application -->');
const htmlEnd = source.indexOf('<!-- Scripts -->');
if (htmlStart === -1 || htmlEnd === -1) {
    console.error("Could not find HTML boundaries.");
    process.exit(1);
}
const appHtml = source.substring(htmlStart + '<!-- Main Application -->'.length, htmlEnd).trim();

const jsStartStr = '<script>\n        // --- 1';
let jsStart = source.indexOf(jsStartStr);
if (jsStart === -1) {
    jsStart = source.indexOf('<script>\n        // --- 1');
}

const jsEndStr = '\n    </script>\n</body>';
const jsEnd = source.lastIndexOf('</script>\n</body>');
if (jsStart === -1 || jsEnd === -1) {
    console.error("Could not find JS boundaries.");
    process.exit(1);
}
const appJs = source.substring(jsStart + '<script>'.length, jsEnd).trim();

// 3. Fix the App JS to not wait for load events, since we eval after login
let fixedJs = appJs;
fixedJs = fixedJs.replace(/window\.addEventListener\('load',\s*\(\)\s*=>\s*{([\s\S]*?)}\);/, '$1');
fixedJs = fixedJs.replace(/window\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*{([\s\S]*?)}\);/, '$1');

// 4. Encrypt them
const password = "Nymda0226!";
const encryptedHtml = CryptoJS.AES.encrypt(appHtml, password).toString();
const encryptedJs = CryptoJS.AES.encrypt(fixedJs, password).toString();

// 5. Construct the new file
const newSourceHead = source.substring(0, htmlStart);

// We need to insert the tv.js script tag BEFORE our decrypted-container logic so it is loaded 
// before someone types password. Actually, the tv.js script is already in source after htmlEnd.
// We'll just leave it where it is.

const newDecryptionLogic = `
    <!-- Encrypted Application Container -->
    <div id="decrypted-container"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
    <script>
        const ciphertextHtml = "${encryptedHtml}";
        const ciphertextJs = "${encryptedJs}";

        function attemptLogin() {
            const p = document.getElementById('password').value;
            const err = document.getElementById('auth-error');
            
            try {
                // Attempt to decrypt
                const bytesHtml = CryptoJS.AES.decrypt(ciphertextHtml, p);
                const decryptedHtml = bytesHtml.toString(CryptoJS.enc.Utf8);
                
                const bytesJs = CryptoJS.AES.decrypt(ciphertextJs, p);
                const decryptedJs = bytesJs.toString(CryptoJS.enc.Utf8);
                
                if (!decryptedHtml || !decryptedJs) throw new Error("Decryption failed");

                // It worked! 
                document.getElementById('auth-overlay').style.display = 'none';
                document.getElementById('decrypted-container').innerHTML = decryptedHtml;
                
                // Execute the JS
                const script = document.createElement('script');
                script.text = decryptedJs;
                document.body.appendChild(script);

                // We want to force tvWidget to null in case they logged out and in, but not needed here.
            } catch (e) {
                err.innerText = "Invalid Password. Decryption Failed.";
                err.style.display = 'block';
                console.error(e);
            }
        }
    </script>
`;

let finalSource = newSourceHead + newDecryptionLogic + source.substring(htmlEnd, jsStart) + "\n</body>\n</html>";

// Provide a fresh login overlay since we commented the old one out
const oldAuthRegex = /<!-- Login Challenge Overlay \(Temporarily Disabled\)[\s\S]*?-->/;
const newAuth = `
    <!-- Login Challenge Overlay -->
    <div id="auth-overlay">
        <div class="auth-box">
            <h1 class="text-gradient" style="font-size: 2.2rem; margin-bottom: 0.5rem; letter-spacing: 1px;">CJ.APP</h1>
            <p style="color: var(--text-muted); margin-bottom: 0.5rem;">Secured Core Interface</p>
            <p
                style="color: var(--buy-color); font-size: 0.8rem; margin-bottom: 2rem; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                AES-256 Encrypted Payload
            </p>

            <input type="password" id="password" class="auth-input" placeholder="Decryption Key (Password)" onkeydown="if(event.key==='Enter') attemptLogin()" />

            <button class="auth-btn" onclick="attemptLogin()">DECRYPT & LOAD</button>
            <div id="auth-error"></div>
        </div>
    </div>
`;

finalSource = finalSource.replace(oldAuthRegex, newAuth);

fs.writeFileSync('index.html', finalSource);
console.log('Successfully encrypted index.html!');
