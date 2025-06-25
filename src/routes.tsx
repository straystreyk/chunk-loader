import {lazy as _lazy} from "react";
import {createBrowserRouter} from "react-router";

function loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${url}"]`);
        if (existing) {
            // avoid double-inserting
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject());
            return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.body.appendChild(script);
    });
}

function lazyWithRetry(factory: () => Promise<any>, chunkName: string, retries = 3, interval = 1000) {
    return _lazy(() => {
        return new Promise(async (resolve, reject) => {
            let lastError: any;

            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    const module = await factory(); // первая попытка — как обычно
                    return resolve(module);
                } catch (error) {
                    lastError = error;
                    console.warn(`[lazyWithRetry] Failed to load ${chunkName} (attempt ${attempt + 1})`, error);

                    // Попробовать загрузить новый URL из манифеста
                    try {
                        const res = await fetch('/chunks-manifest.json', { cache: 'no-cache' });
                        const manifest = await res.json();

                        const url = manifest[chunkName];
                        if (url) {
                            console.info(`[lazyWithRetry] Trying updated chunk URL: ${url}`);
                            await loadScript(url); // загружаем новый URL
                            const module = await factory(); // снова вызываем factory, теперь модуль уже есть
                            return resolve(module);
                        }
                    } catch (e) {
                        console.warn(`[lazyWithRetry] Retry failed:`, e);
                    }

                    if (attempt < retries) {
                        await new Promise(res => setTimeout(res, interval));
                    }
                }
            }

            reject(lastError);
        });
    });
}


const Page1 = lazyWithRetry(() => import( /* webpackChunkName: "my-chunk-1" */ "./pages/Page1"), "my-chunk-1");
const Page2 = lazyWithRetry(() => import( /* webpackChunkName: "my-chunk-2" */ "./pages/Page2"), "my-chunk-2");

const router = createBrowserRouter([
    {
        path: "/",
        element: <Page1/>
    },
    {
        path: "/page2",
        element: <Page2/>
    }
])

export default router;