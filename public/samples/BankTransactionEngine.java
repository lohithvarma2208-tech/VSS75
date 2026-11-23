package in.klu.y26.pspj.banking;

import java.util.concurrent.locks.ReentrantLock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * KL University Y26 Curriculum - 26SC1101 Problem Solving Using Programming (Java)
 * Thread-Safe High-Throughput Campus Wallet Engine.
 */
public class BankTransactionEngine {
    private final Map<String, Account> accounts = new ConcurrentHashMap<>();
    private final ReentrantLock transferLock = new ReentrantLock();

    public static class Account {
        private final String accountId;
        private double balance;

        public Account(String accountId, double initialBalance) {
            this.accountId = accountId;
            this.balance = initialBalance;
        }

        public synchronized void deposit(double amount) {
            if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
            this.balance += amount;
        }

        public synchronized boolean withdraw(double amount) {
            if (amount > balance) return false;
            this.balance -= amount;
            return true;
        }

        public synchronized double getBalance() { return balance; }
        public String getAccountId() { return accountId; }
    }

    public boolean transferFunds(String fromId, String toId, double amount) {
        transferLock.lock();
        try {
            Account from = accounts.get(fromId);
            Account to = accounts.get(toId);
            if (from == null || to == null) return false;
            if (from.withdraw(amount)) {
                to.deposit(amount);
                return true;
            }
            return false;
        } finally {
            transferLock.unlock();
        }
    }
}
