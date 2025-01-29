import { useState } from 'react';
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowRight, Plus, Minus, Wallet, Banknote, Clock, CheckCircle2, XCircle } from "lucide-react";

export const InvestmentManager = () => {
  const { resolvedTheme } = useTheme();
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | null>(null);
  const [transactions, setTransactions] = useState(mockTransactions);
  
  const isDarkMode = resolvedTheme === 'dark';

  const statusStyles = {
    Completed: isDarkMode ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Pending: isDarkMode ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-amber-100 text-amber-700 border-amber-200',
    Failed: isDarkMode ? 'bg-red-400/10 text-red-400 border-red-400/20' : 'bg-red-100 text-red-700 border-red-200',
    Processing: isDarkMode ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' : 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50'
    }`}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Action Header */}
        <div className={`flex justify-between items-center pb-6 border-b ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div>
            <h1 className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Capital Management
            </h1>
            <div className="flex gap-4 mt-2">
              <div className={`text-sm px-3 py-1 rounded-full border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-purple-400/20 border-purple-400/30 text-purple-300' 
                  : 'bg-purple-600/10 border-purple-600/20 text-purple-700'
              }`}>
                <Wallet className="inline mr-2 h-4 w-4" />
                Available: <span className="font-semibold">25,000 DAI</span>
              </div>
              <div className={`text-sm px-3 py-1 rounded-full border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-pink-400/20 border-pink-400/30 text-pink-300' 
                  : 'bg-pink-600/10 border-pink-600/20 text-pink-700'
              }`}>
                <Banknote className="inline mr-2 h-4 w-4" />
                Locked: <span className="font-semibold">150,000 DAI</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={() => setActiveModal('deposit')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Deposit
            </Button>
            <Button
              onClick={() => setActiveModal('withdraw')}
              variant="outline"
              className={`transition-colors ${
                isDarkMode 
                  ? 'border-purple-400 text-purple-400 hover:bg-purple-400/10' 
                  : 'border-purple-600 text-purple-600 hover:bg-purple-100'
              }`}
            >
              <Minus className="mr-2 h-4 w-4" />
              Request Withdrawal
            </Button>
          </div>
        </div>

        {/* Transaction Ledger */}
        <Card className={`backdrop-blur-lg transition-all ${
          isDarkMode 
            ? 'bg-slate-800/40 border-white/10' 
            : 'bg-white/80 border-gray-200'
        } shadow-none`}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className={`text-lg ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Transaction History
              </CardTitle>
              <div className="flex gap-4">
                <Button variant="outline" className={`transition-colors ${
                  isDarkMode 
                    ? 'border-white/10 hover:bg-white/10 text-slate-300' 
                    : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                }`}>
                  Last 30 Days ▼
                </Button>
                <Button variant="outline" className={`transition-colors ${
                  isDarkMode 
                    ? 'border-white/10 hover:bg-white/10 text-slate-300' 
                    : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                }`}>
                  Export Ledger
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className={`${
                  isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                } transition-colors`}>
                  <TableHead className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>Date/Time</TableHead>
                  <TableHead className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>Type</TableHead>
                  <TableHead className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>Amount</TableHead>
                  <TableHead className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>Transaction ID</TableHead>
                  <TableHead className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>Destination</TableHead>
                  <TableHead className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>Status</TableHead>
                  <TableHead className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className={`${
                    isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                  } transition-colors`}>
                    <TableCell className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
                      {tx.date}<br/>
                      <span className="text-xs text-gray-500">{tx.time}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        tx.type === 'Deposit' 
                          ? (isDarkMode ? 'text-purple-400' : 'text-purple-600') 
                          : (isDarkMode ? 'text-pink-400' : 'text-pink-600')
                      }`}>
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
                      {tx.amount} DAI
                    </TableCell>
                    <TableCell className={`font-mono text-sm ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      {tx.txHash}
                    </TableCell>
                    <TableCell className={`max-w-[200px] truncate ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      {tx.destination}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full border ${statusStyles[tx.status]}`}>
                        {tx.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" className={`transition-colors ${
                        isDarkMode 
                          ? 'text-purple-400 hover:bg-purple-400/10' 
                          : 'text-purple-600 hover:bg-purple-100'
                      }`}>
                        View Receipt
                      </Button>
                      {tx.status === 'Pending' && (
                        <Button variant="ghost" className={`transition-colors ${
                          isDarkMode 
                            ? 'text-red-400 hover:bg-red-400/10' 
                            : 'text-red-600 hover:bg-red-100'
                        }`}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Deposit Modal */}
        <Dialog open={activeModal === 'deposit'} onOpenChange={(open) => !open && setActiveModal(null)}>
          <DialogContent className={`max-w-md backdrop-blur-sm ${
            isDarkMode 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/50 border-gray-200'
          }`}>
            <DialogHeader>
              <DialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                New Deposit
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className={`text-sm font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  Amount (DAI)
                </label>
                <Input 
                  placeholder="0.00" 
                  type="number" 
                  step="0.01"
                  className={`text-lg font-medium ${
                    isDarkMode 
                      ? 'bg-slate-700/50 border-white/10 text-white' 
                      : 'bg-white border-gray-200'
                  }`}
                />
              </div>
              
              <div className="space-y-2">
                <label className={`text-sm font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  Funding Source
                </label>
                <select className={`w-full p-2 rounded-md ${
                  isDarkMode 
                    ? 'bg-slate-700/50 border-white/10 text-white' 
                    : 'bg-white border-gray-200'
                }`}>
                  <option>Bank Transfer (ACH)</option>
                  <option>USDC Wallet</option>
                  <option>Credit/Debit Card</option>
                  <option>External Wallet</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  Transaction Notes
                </label>
                <Input 
                  placeholder="Add reference note (optional)"
                  className={isDarkMode ? 'bg-slate-700/50 border-white/10' : ''}
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className={`w-4 h-4 ${
                    isDarkMode 
                      ? 'accent-purple-400 bg-slate-700/50' 
                      : 'accent-purple-600'
                  }`}
                />
                <span className={`text-sm ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  I confirm this deposit complies with our {' '}
                  <a href="#" className={`hover:underline ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                    terms of service
                  </a>
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 text-white"
                onClick={() => setActiveModal(null)}
              >
                Confirm Deposit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdrawal Modal */}
        <Dialog open={activeModal === 'withdraw'} onOpenChange={(open) => !open && setActiveModal(null)}>
          <DialogContent className={`max-w-md backdrop-blur-sm ${
            isDarkMode 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/50 border-gray-200'
          }`}>
            <DialogHeader>
              <DialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                Withdraw Funds
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className={`text-sm font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  Amount (DAI)
                </label>
                <div className="relative">
                  <Input 
                    placeholder="0.00" 
                    type="number"
                    className={`text-lg font-medium pr-24 ${
                      isDarkMode 
                        ? 'bg-slate-700/50 border-white/10 text-white' 
                        : 'bg-white border-gray-200'
                    }`}
                  />
                  <div className={`absolute right-3 top-3 text-sm ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Max: 25,000 DAI
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  Destination Wallet
                </label>
                <Input 
                  placeholder="0x..." 
                  className={`font-mono ${
                    isDarkMode 
                      ? 'bg-slate-700/50 border-white/10' 
                      : 'bg-white border-gray-200'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  Transaction Speed
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" className={`h-10 ${
                    isDarkMode 
                      ? 'border-white/10 hover:bg-white/10' 
                      : 'border-gray-200 hover:bg-gray-100'
                  }`}>
                    <Clock className="mr-2 h-4 w-4" />
                    Slow
                  </Button>
                  <Button variant="outline" className={`h-10 border-purple-400/50 ${
                    isDarkMode 
                      ? 'bg-purple-400/10 hover:bg-purple-400/20' 
                      : 'bg-purple-100 hover:bg-purple-200'
                  }`}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Normal
                  </Button>
                  <Button variant="outline" className={`h-10 ${
                    isDarkMode 
                      ? 'border-white/10 hover:bg-white/10' 
                      : 'border-gray-200 hover:bg-gray-100'
                  }`}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Fast
                  </Button>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${
                isDarkMode 
                  ? 'bg-slate-700/30 text-slate-300' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <div className="flex justify-between text-sm">
                  <span>Estimated Gas Fee:</span>
                  <span className="font-medium">1.20 DAI</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Total Deducted:</span>
                  <span className="font-medium">501.20 DAI</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 text-white"
                onClick={() => setActiveModal(null)}
              >
                Confirm Withdrawal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const mockTransactions = [
  {
    id: 1,
    date: '2024-03-15',
    time: '14:23 UTC',
    type: 'Deposit',
    amount: '10,000',
    txHash: '0x4a3b...f8c2',
    destination: 'Bank Account ****1234',
    status: 'Completed'
  },
  {
    id: 2,
    date: '2024-03-14',
    time: '09:45 UTC',
    type: 'Withdrawal',
    amount: '5,000',
    txHash: '0x8d7e...g432',
    destination: 'Bank Account ****4322',
    status: 'Processing'
  }
];