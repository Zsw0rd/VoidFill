import { Card, CardContent } from "@/components/ui/card";

export default function PracticeTestLoading() {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-4">
            <div className="h-9 w-48 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-4 w-80 rounded-lg bg-white/5 animate-pulse" />
            <div className="grid sm:grid-cols-3 gap-3 mt-8">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="bg-white/5">
                        <CardContent className="p-5 animate-pulse">
                            <div className="h-8 w-16 mx-auto rounded-lg bg-white/10" />
                            <div className="h-3 w-24 mx-auto mt-2 rounded-lg bg-white/5" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardContent className="p-8 animate-pulse">
                    <div className="h-12 w-12 rounded-full bg-white/10 mx-auto" />
                    <div className="h-5 w-40 mx-auto mt-4 rounded-lg bg-white/10" />
                    <div className="h-4 w-64 mx-auto mt-2 rounded-lg bg-white/5" />
                </CardContent>
            </Card>
        </div>
    );
}
