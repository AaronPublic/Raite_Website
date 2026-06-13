"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2c.46-1.71.46-5.33.46-5.33s0-3.62-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="w-full bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logos Section */}
          <div className="col-span-1 md:col-span-1 flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center space-x-4">
              <Image
                src="/psite.png"
                alt="PSITE Logo"
                width={60}
                height={60}
                className="h-10 w-auto object-contain"
              />
              <Image
                src="/RAITE.png"
                alt="RAITE Logo"
                width={60}
                height={60}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center md:text-left">
              PSITE Region III - RAITE Event Registration Platform
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <Image
                src="/UA-Logo.png"
                alt="UA Logo"
                width={60}
                height={60}
                className="h-10 w-auto object-contain"
              />
              <Image
                src="/newcit.png"
                alt="CIT Logo"
                width={70}
                height={70}
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 text-center md:text-left">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Competitions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="col-span-1 text-center md:text-left">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">
              Connect
            </h3>
            <div className="space-y-3 flex flex-col items-center md:items-start">
              <a
                href="https://facebook.com/psiteregion3"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <FacebookIcon className="h-4 w-4" />
                <span>psiteregion3</span>
              </a>
              <a
                href="https://youtube.com/@psitecentralluzon899"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <YoutubeIcon className="h-4 w-4" />
                <span>@psitecentralluzon899</span>
              </a>
              <a
                href="mailto:psitecl.raite@gmail.com"
                className="flex items-center space-x-3 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>psitecl.raite@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Developed By */}
          <div className="col-span-1 flex flex-col items-center md:items-end justify-between text-center md:text-right">
            <div className="hidden md:block">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">
                About
              </h3>
              <p className="text-[10px] text-muted-foreground max-w-[200px]">
                Providing quality IT education and professional development in Region III.
              </p>
            </div>
            <div className="mt-8 md:mt-0 flex flex-col items-center md:items-end gap-2">
              <p className="text-xs font-medium text-foreground">
                Developed by:{" "}
                <span className="font-bold">
                  <span className="text-blue-600">H</span>
                  <span className="text-yellow-500">O</span>
                  <span className="text-red-600">W</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col items-center gap-4 text-[10px] text-muted-foreground">
          <p>© 2026 PSITE Region III. All rights reserved.</p>
          <Dialog>
            <DialogTrigger asChild>
              <button className="hover:text-primary transition-colors cursor-pointer outline-none underline">
                Privacy Policy
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] w-[95vw]">
              <DialogHeader>
                <DialogTitle>Privacy Policy</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <DialogDescription className="text-xs sm:text-sm leading-relaxed text-justify">
                  PSITE Central Luzon recognizes the responsibilities under the Republic Act No. 10173, also known as the Data Privacy Act of 2012, with respect to the data to collect, record, organize, update, use, consolidate or destruct from the applicants. The personal data obtained from this form will be stored in the organization's database and will only be accessed by authorized members of the PSITE Central Luzon. Furthermore, the information collected and stored shall only be used for the following purposes: processing and reporting of documents, researches for program improvement, and announcements / promotions of events, programs, courses and other activities offered by the organization. PSITE shall not disclose the participant's personal information without their consent and shall retain this information over a period of ten years for the effective implementation and management of the program.
                </DialogDescription>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" className="w-full">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
