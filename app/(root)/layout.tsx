import "../globals.css";
import Link from 'next/link';
import { ReactNode } from 'react'
import Image from 'next/image'

const RootLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className='root-layout'>
            <nav>
                <Link href="/" className='flex items-center gap-2'>
                    <Image src="/vercel.svg" alt="logo" width={32} height={32} />
                    <h2 className='text-primary-100'>TeleInteruv</h2>
                </Link>
            </nav>

            {children}
        </div>
    )
}

export default RootLayout