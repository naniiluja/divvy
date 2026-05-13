import { View, Text, Modal, Pressable } from 'react-native'
import type { FC } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface AIGenerateSheetProps {
  isVisible: boolean
  onClose: () => void
  onGenerate: (prompt: string) => void
  isLoading?: boolean
  prompt: string
  onPromptChange: (text: string) => void
}

export const AIGenerateSheet: FC<AIGenerateSheetProps> = ({
  isVisible,
  onClose,
  onGenerate,
  isLoading = false,
  prompt,
  onPromptChange,
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="flex-1 bg-black/40"
          onPress={onClose}
        />
        <View className="bg-neu-bg dark:bg-neu-d-bg rounded-t-card p-6 gap-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-text-dark dark:text-text-dark-d text-lg font-display">
              ✨ AI Gợi ý Task
            </Text>
            <Pressable onPress={onClose} className="min-h-[44px] min-w-[44px] items-center justify-center">
              <Text className="text-text-mid dark:text-text-mid-d font-body">✕</Text>
            </Pressable>
          </View>

          <Input
            label="Mô tả nhà bạn"
            value={prompt}
            onChangeText={onPromptChange}
            placeholder="Ví dụ: Căn hộ 2 người, có chó nhỏ..."
            multiline
          />

          <Button
            label="Tạo danh sách task"
            onPress={() => onGenerate(prompt)}
            isLoading={isLoading}
            size="lg"
          />
        </View>
      </View>
    </Modal>
  )
}
