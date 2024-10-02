import SampleManager from "@/components/SampleManager";
import { Toaster } from "react-hot-toast";

export default function Home() {
    return (
        <>
            <SampleManager />
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        borderRadius: "10px",
                        background: "#333",
                        color: "#fff",
                    },
                }}
            />
        </>
    );
}
